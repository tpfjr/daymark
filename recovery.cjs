const Core=require('./ui/core.js');
// Pending values are never promoted to confirmed state without a storage acknowledgment.
class Recovery {
 constructor(){this.confirmed=null;this.confirmedId=0;this.days=new Map();this.meta=null;this.full=null;this.operations=new Map()}
 stage(id,method,value){if(!['patch','save'].includes(method))return;this.operations.set(id,{id,method,status:'pending'});if(method==='save'){this.full={id,value:typeof value==='string'?JSON.parse(value):value};this.days.clear();this.meta=null}else{for(let [date,day]of Object.entries(value.days||{}))this.days.set(date,{id,value:day});if(value.meta)this.meta={id,value:value.meta}}this.prune()}
 prune(){let ids=new Set([...this.days.values(),this.meta,this.full].filter(Boolean).map(x=>x.id));for(let id of this.operations.keys())if(!ids.has(id))this.operations.delete(id)}
 status(id,status,error){let op=this.operations.get(id);if(op)Object.assign(op,{status,error})}
 unknown(error){for(let op of this.operations.values())if(op.status==='pending')Object.assign(op,{status:'unknown',error})}
 acknowledge(id,result,method){if(id>=this.confirmedId){if(method==='read'){this.confirmed=result;this.confirmedId=id}else if(result?.appliedState){this.confirmed=result.appliedState;this.confirmedId=id}else if(result?.applied&&this.confirmed){this.confirmed=this.overlay(this.confirmed,result.applied);this.confirmedId=id}}
  if(result?.appliedState){if(this.full?.id<=id)this.full=null;if(this.meta?.id<=id)this.meta=null;for(let [key,entry]of this.days)if(entry.id<=id)this.days.delete(key)}
  if(result?.applied){if(result.applied.meta&&this.meta?.id<=id)this.meta=null;for(let key of Object.keys(result.applied.days||{}))if(this.days.get(key)?.id<=id)this.days.delete(key)}this.prune()
 }
 overlay(state,patch){let days=new Map(Object.entries(state.days||{}));for(let [date,value]of Object.entries(patch.days||{})){if(value===null)days.delete(date);else days.set(date,value)}return {...state,...patch.meta,days:Object.fromEntries(days)}}
 validate(state){try{if(!state)throw Error('No confirmed baseline is available.');Core.normalize(state);return {valid:true}}catch(e){return {valid:false,error:e.message}}}
 export(){let candidate=this.full?.value||this.confirmed;if(candidate)candidate=this.overlay(candidate,{meta:this.meta?.value,days:Object.fromEntries([...this.days].map(([key,entry])=>[key,entry.value]))});return {format:'daymark-recovery',formatVersion:1,exportedAt:new Date().toISOString(),confirmed:this.confirmed?{state:this.confirmed,validation:this.validate(this.confirmed),acknowledgment:this.confirmedId}:null,pending:this.operations.size?{state:candidate,validation:this.validate(candidate),operations:[...this.operations.values()]}:null}}
}
module.exports={Recovery};
