import { parseEnvelope } from '../src/lib/storage/persist';

type StoredObject = { body: ReadableStream; httpEtag: string; customMetadata?: Record<string,string>; };
type Bucket = {
  head(key:string):Promise<Omit<StoredObject,'body'>|null>;
  get(key:string):Promise<StoredObject|null>;
  put(key:string,value:string,options:{onlyIf:Headers;httpMetadata:{contentType:string};customMetadata:Record<string,string>}):Promise<Omit<StoredObject,'body'>|null>;
};
export interface BackupEnv { BUCKET?: Bucket }
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','vary':'oai-authenticated-user-id'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});

/** Identity is supplied and verified by Sites, never accepted from query/body. */
export async function backupApi(req:Request,env:BackupEnv):Promise<Response> {
  const id=req.headers.get('oai-authenticated-user-id');
  if(!id||id.length>256)return reply({error:'Entre com a conta autorizada para acessar o backup.'},401);
  if(!env.BUCKET)return reply({error:'Backup em nuvem ainda não configurado.'},503);
  const key=`households/${encodeURIComponent(id)}/backup.json`;
  try {
    if(req.method==='GET'){
      if(new URL(req.url).searchParams.get('meta')==='1'){
        const o=await env.BUCKET.head(key);
        return reply({available:!!o,etag:o?.httpEtag??null,savedAt:o?.customMetadata?.['savedAt']??null});
      }
      const o=await env.BUCKET.get(key);
      return o?new Response(o.body,{headers:{...headers,etag:o.httpEtag}}):reply({error:'Não há backup nesta conta.'},404);
    }
    if(req.method!=='PUT')return reply({error:'Método não permitido.'},405);
    if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Origem não autorizada.'},403);
    if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'Formato inválido.'},415);
    const match=req.headers.get('if-match');const none=req.headers.get('if-none-match');
    if((!match&&none!=='*')||(match&&none))return reply({error:'Confira a versão do backup antes de salvar.'},428);
    if(match==='*'||(match&&match.length>150))return reply({error:'Versão de backup inválida.'},400);
    const reader=req.body?.getReader();if(!reader)return reply({error:'Arquivo vazio.'},400);
    const chunks:Uint8Array[]=[];let bytes=0;
    while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.length;if(bytes>5_000_000){await reader.cancel();return reply({error:'Limite de backup: 5 MB.'},413);}chunks.push(part.value);}
    const data=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
    const raw=new TextDecoder().decode(data);const parsed=parseEnvelope(raw);
    if(parsed.status!=='ok')return reply({error:'Cópia inválida ou incompatível. Backup anterior preservado.'},400);
    const conditions=new Headers();if(match)conditions.set('if-match',match);else conditions.set('if-none-match','*');
    const savedAt=new Date().toISOString();
    const out=await env.BUCKET.put(key,raw,{onlyIf:conditions,httpMetadata:{contentType:'application/json'},customMetadata:{savedAt}});
    if(!out)return reply({error:'Outro aparelho atualizou o backup. Confira a cópia mais recente antes de substituir.'},409);
    return reply({available:true,etag:out.httpEtag,savedAt});
  }catch {return reply({error:'Não foi possível acessar a nuvem. Seus dados locais permanecem no aparelho.'},503);}
}
