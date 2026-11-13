import { describe,it,expect } from 'vitest';
import { backupApi, type BackupEnv } from '../../hosting/backup';
import { serialize } from '@/lib/storage/persist';
import { emptyData } from '@/lib/domain/types';

function bucket(){
  const objects=new Map<string,{text:string;httpEtag:string;customMetadata:Record<string,string>}>();let seq=0;
  const api:NonNullable<BackupEnv['BUCKET']>={
    async head(key){return objects.get(key)??null;},
    async get(key){const o=objects.get(key);return o?{...o,body:new Response(o.text).body!}:null;},
    async put(key,text,opts){const old=objects.get(key);if(opts.onlyIf.get('if-none-match')==='*'&&old)return null;if(opts.onlyIf.has('if-match')&&old?.httpEtag!==opts.onlyIf.get('if-match'))return null;const o={text,httpEtag:`"v${++seq}"`,customMetadata:opts.customMetadata};objects.set(key,o);return o;},
  };return {api,objects};
}
const origin='https://app.test';
function request(user:string|null,method='GET',body?:string,etag?:string){const h=new Headers();if(user)h.set('oai-authenticated-user-id',user);if(method==='PUT'){h.set('origin',origin);h.set('content-type','application/json');h.set(etag?'if-match':'if-none-match',etag??'*');}return new Request(origin+'/api/backup',{method,headers:h,...(body!==undefined?{body}:{})});}
describe('backup privado no servidor',()=>{
 it('recusa acesso sem identidade e gravações de outra origem',async()=>{
  const b=bucket();expect((await backupApi(request(null),{BUCKET:b.api})).status).toBe(401);
  const r=request('a','PUT',serialize(emptyData()));r.headers.set('origin','https://outra.test');expect((await backupApi(r,{BUCKET:b.api})).status).toBe(403);expect(b.objects.size).toBe(0);
 });
 it('mantém cada conta isolada e recupera a cópia válida',async()=>{
  const b=bucket();const body=serialize(emptyData());expect((await backupApi(request('a','PUT',body),{BUCKET:b.api})).status).toBe(200);
  expect((await backupApi(request('b'),{BUCKET:b.api})).status).toBe(404);expect(await (await backupApi(request('a'),{BUCKET:b.api})).text()).toBe(body);
 });
 it('não sobrescreve versão concorrente ou cópia inválida',async()=>{
  const b=bucket();const body=serialize(emptyData());const first=await (await backupApi(request('a','PUT',body),{BUCKET:b.api})).json();
  expect((await backupApi(request('a','PUT',body),{BUCKET:b.api})).status).toBe(409);
  expect((await backupApi(request('a','PUT','{"invalido":true}',first.etag),{BUCKET:b.api})).status).toBe(400);
  expect((await backupApi(request('a','PUT',body,'"antigo"'),{BUCKET:b.api})).status).toBe(409);
  expect((await backupApi(request('a','PUT',body,first.etag),{BUCKET:b.api})).status).toBe(200);
 });
 it('indica indisponibilidade sem inventar backup',async()=>{
  expect((await backupApi(request('a'),{})).status).toBe(503);
 });
});
