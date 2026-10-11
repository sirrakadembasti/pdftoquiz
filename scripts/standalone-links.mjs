import {cpSync,existsSync,lstatSync,mkdirSync,readdirSync,readFileSync,realpathSync,symlinkSync} from 'node:fs';
import {join,relative,resolve,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

// Next's Windows tracing can copy pnpm package files but omit dependency links.
// Windows junctions contain absolute paths. Materialize repaired packages and
// their dependencies there, so relocating the output does not break resolution.
function packageDirectory(require,name){
 try{return dirname(require.resolve(name+'/package.json'));}catch{}
 let dir=dirname(require.resolve(name));
 while(dirname(dir)!==dir){const manifest=join(dir,'package.json');if(existsSync(manifest)&&JSON.parse(readFileSync(manifest,'utf8')).name===name)return dir;dir=dirname(dir);}
 throw new Error('Dependency package directory not found: '+name);
}
function materializePackage(from,to,ancestors=new Set()){
 const source=realpathSync(from);if(ancestors.has(source))return;
 cpSync(source,to,{recursive:true,filter:path=>path!==join(source,'node_modules')});
 const manifest=join(source,'package.json');if(!existsSync(manifest))return;
 const pkg=JSON.parse(readFileSync(manifest,'utf8')),require=createRequire(manifest),optional=pkg.optionalDependencies||{},next=new Set([...ancestors,source]);
 for(const name of Object.keys({...pkg.dependencies,...optional})){
  let dependency;try{dependency=packageDirectory(require,name);}catch(e){if(name in optional)continue;throw e;}
  if(next.has(realpathSync(dependency)))continue;
  materializePackage(dependency,join(to,'node_modules',name),next);
 }
}
export function restoreStandaloneLinks(sourceRoot,outputRoot){
 const source=realpathSync(sourceRoot),output=resolve(outputRoot);let count=0;
 function visit(dir){
  const original=join(source,relative(output,dir));
  if(existsSync(original)&&!lstatSync(original).isSymbolicLink()){
   for(const entry of readdirSync(original,{withFileTypes:true})){
    const from=join(original,entry.name),to=join(dir,entry.name);
    if(entry.isDirectory()&&entry.name.startsWith('@')&&!existsSync(to))mkdirSync(to,{recursive:true});
    if(!entry.isSymbolicLink()||existsSync(to))continue;
    const target=realpathSync(from),local=relative(source,target);
    if(local==='..'||local.startsWith('..'+sep)||resolve(source,local)!==target)continue;
    const copied=join(output,local);
    // libsql selects its native addon dynamically, so tracing may omit it.
    if(!existsSync(copied)&&/[/\\]@libsql[/\\](?:win32|linux|darwin|android|freebsd)-[^/\\]+$/.test(target)){
     mkdirSync(dirname(copied),{recursive:true});cpSync(target,copied,{recursive:true});
    }
    if(!existsSync(copied))continue;
    // Do not overwrite existing broken links or replace any copied files.
    try{lstatSync(to);continue;}catch(e){if(e.code!=='ENOENT')throw e;}
    mkdirSync(dirname(to),{recursive:true});
    if(process.platform==='win32'&&lstatSync(target).isDirectory())materializePackage(target,to);
    else symlinkSync(relative(dirname(to),copied),to,lstatSync(target).isDirectory()?'dir':'file');
    count++;
   }
  }
  for(const entry of readdirSync(dir,{withFileTypes:true}))if(entry.isDirectory()&&!entry.isSymbolicLink())visit(join(dir,entry.name));
 }
 visit(output);return count;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('Standalone dependency links restored: '+restoreStandaloneLinks(resolve('.'),resolve('.next/standalone')));
