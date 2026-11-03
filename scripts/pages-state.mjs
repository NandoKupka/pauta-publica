import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { migrateSnapshot } from '../data-quality.mjs';

const git=(args,input)=>execFileSync('git',args,{encoding:'utf8',input,maxBuffer:256*1024*1024,stdio:['pipe','pipe','pipe']}).trim();
const branch='refs/heads/data';
function exists() {
  try{return Boolean(git(['ls-remote','--exit-code','--heads','origin',branch]));}
  catch(error){if(error.status===2)return false;throw error;}
}
function fetchState() {git(['fetch','--no-tags','--depth=1','origin',branch+':refs/remotes/origin/data']);return git(['rev-parse','refs/remotes/origin/data']);}
function validate(text) {
  const value=JSON.parse(text);
  if(value.version!==2||!value.jobs||!Object.keys(value.jobs).length)throw new Error('Estado de coleta inválido');
  return migrateSnapshot(value);
}
if(process.env.GITHUB_ACTIONS!=='true')throw new Error('Este comando de sincronização é exclusivo do GitHub Actions');
const mode=process.argv[2];
if(mode==='restore'){
  if(exists()){
    fetchState();const text=git(['show','refs/remotes/origin/data:snapshot.json']);validate(text);
    await mkdir('data',{recursive:true});await writeFile('data/live.json',text);
    console.log('Histórico restaurado da branch data.');
  }else console.log('Primeira publicação: usando a cópia inicial versionada.');
}else if(mode==='save'){
  let text;try{text=await readFile('data/live.json','utf8');}catch{console.log('Sem nova coleta para preservar.');process.exit(0);}
  validate(text);
  const parent=exists()?fetchState():null;
  if(parent){
    const previous=validate(git(['show',parent+':snapshot.json']));
    if(Date.parse(previous.checkedAt)>Date.parse(JSON.parse(text).checkedAt))throw new Error('Há uma coleta mais recente na branch data; publicação interrompida para preservar o histórico');
  }
  const blob=git(['hash-object','-w','--stdin'],text);
  const tree=git(['mktree'],'100644 blob '+blob+'\tsnapshot.json\n');
  if(parent&&git(['rev-parse',parent+'^{tree}'])===tree){console.log('O histórico já está sincronizado.');process.exit(0);}
  const sha=git(['-c','user.name=github-actions[bot]','-c','user.email=41898282+github-actions[bot]@users.noreply.github.com','commit-tree',tree,...(parent?['-p',parent]:[])],'Atualiza dados oficiais do Pauta Pública\n');
  // A normal push rejects concurrent updates instead of overwriting newer history.
  git(['push','origin',sha+':'+branch]);console.log('Histórico preservado na branch data: '+sha.slice(0,7));
}else throw new Error('Use restore ou save');
