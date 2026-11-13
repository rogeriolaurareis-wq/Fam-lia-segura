import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Note, Section } from './page';
import { useStore } from '@/lib/storage/store';
type Meta={available:boolean;etag:string|null;savedAt:string|null};
export function CloudBackup(){
  const {exportText,importText,phase}=useStore();const [meta,setMeta]=useState<Meta|null>(null);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [restore,setRestore]=useState(false);
  const refresh=async()=>{try{const r=await fetch('/api/backup?meta=1',{cache:'no-store'});const j=await r.json();if(!r.ok)throw new Error(j.error||'Serviço indisponível.');setMeta(j);setMessage('');}catch{setMessage('Backup em nuvem indisponível neste endereço. Você pode baixar uma cópia em arquivo abaixo.');}};
  useEffect(()=>{void refresh();},[]);
  const save=async()=>{if(!meta)return;setBusy(true);try{const r=await fetch('/api/backup',{method:'PUT',headers:{'content-type':'application/json',...(meta.etag?{'if-match':meta.etag}:{'if-none-match':'*'})},body:exportText()});const j=await r.json();if(!r.ok)throw new Error(j.error);setMeta(j);setMessage('Backup concluído. Esta cópia pode ser recuperada em outro aparelho autorizado.');}catch(e){setMessage(e instanceof Error?e.message:'Falha ao guardar backup.');}finally{setBusy(false);}};
  const recover=async()=>{setBusy(true);try{const r=await fetch('/api/backup',{cache:'no-store'});if(!r.ok)throw new Error('Não foi possível recuperar o backup.');const result=importText(await r.text());if(!result.ok)throw new Error(result.message);setMessage('Backup recuperado neste aparelho.');await refresh();}catch(e){setMessage(e instanceof Error?e.message:'Falha de recuperação.');}finally{setBusy(false);setRestore(false);}};
  return <Section title="Backup em outro aparelho" description="Cópia privada da versão de testes, vinculada à sua conta de acesso a este endereço.">
    <p>Último backup concluído: {meta?.savedAt?new Date(meta.savedAt).toLocaleString('pt-BR'):'nenhum confirmado'}.</p>
    <p className="mt-2 text-sm">Nesta versão privada, entre com a mesma conta ChatGPT para recuperar os dados em outro aparelho. Isso ainda não é a chave própria de acesso do produto final. Só os dados enviados no último backup estarão disponíveis.</p>
    <div className="mt-4 flex flex-wrap gap-2"><Button disabled={busy||!meta||phase!=='ready'} onClick={save}>Guardar backup agora</Button><Button variant="outline" disabled={busy||!meta?.available||phase!=='ready'} onClick={()=>setRestore(true)}>Recuperar último backup</Button><Button variant="ghost" disabled={busy} onClick={refresh}>Conferir nuvem</Button></div>
    {message&&<p className="mt-3 font-bold" role="status">{message}</p>}
    <div className="mt-3"><Note title="Cópia por confirmação">As alterações ficam primeiro neste aparelho. Toque em “Guardar backup agora” para atualizar a cópia na nuvem. Não há sincronização automática entre casas.</Note></div>
    <ConfirmDialog open={restore} onOpenChange={setRestore} title="Recuperar os dados da nuvem?" description="O conteúdo deste aparelho será substituído pela última cópia. O aplicativo tenta guardar uma cópia local dos dados atuais antes da importação." confirmLabel="Recuperar cópia" onConfirm={()=>void recover()}/>
  </Section>;
}
