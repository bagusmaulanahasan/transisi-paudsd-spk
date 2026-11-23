import { calculateAHP } from "../../src/lib/spk/ahp.js";
import { normalisasiMatriks, hitungMoora } from "../../src/lib/spk/moora.js";

const w3 = [0.6,0.3,0.1];
const m3 = w3.map((wi,i)=>w3.map((wj,j)=> (i===j?1: (Math.round((wi/wj)*10000)/10000))));
const w4 = [0.4,0.3,0.2,0.1];
const m4 = w4.map((wi,i)=>w4.map((wj,j)=> (i===j?1: wi/wj)));
const w5 = [0.3,0.25,0.2,0.15,0.1];
const m5 = w5.map((wi,i)=>w5.map((wj,j)=> (i===j?1: wi/wj)));
const m10 = Array.from({length:10},(_,i)=>Array.from({length:10},(_,j)=>(i+1)/(j+1)));
const m11 = Array.from({length:11},(_,i)=>Array.from({length:11},(_,j)=>(i+1)/(j+1)));
const m12 = Array.from({length:12},(_,i)=>Array.from({length:12},(_,j)=>(i+1)/(j+1)));
const mCR0999=[[1,1,1,9],[1,1,5,8],[1,0.2,1,4],[1/9,0.125,0.25,1]];
const mCR01=[[1,1,1,3],[1,1,4,2],[1,0.25,1,2],[1/3,0.5,0.5,1]];
const mCR01001=[[1,1,1,2],[1,1,4,9],[1,0.25,1,2],[0.5,1/9,0.5,1]];
const mCR011=[[1,1,1,7],[1,1,2,3],[1,0.5,1,9],[1/7,1/3,1/9,1]];
const mInc=[[1,5,1],[1/5,1,7],[1,1/7,1]];
const cases={m3,m4,m5,m10,m11,m12,mCR0999,mCR01,mCR01001,mCR011,mInc};
for(const [k,m] of Object.entries(cases)){
  const r=calculateAHP(m);
  console.log(k, JSON.stringify(r));
}
console.log('norm', JSON.stringify(normalisasiMatriks([[0,3],[0,4]])));

function anak(id,nama,extra={}){return {id,nama,...extra};}
function kriteria(id,jenis){return {id,jenis};}
function indikator(id,kriteria_id){return {id,kriteria_id};}
function jawaban(anak_id,indikator_id,poin){return {anak_id,indikator_id,poin};}

function run(label, data){const r=hitungMoora(data); console.log('MOORA',label,JSON.stringify({jumlahLengkap:r.jumlahLengkap,jumlahAnak:r.jumlahAnak,baris:r.baris.map(b=>({id:b.anak_id,yi:b.yi,ranking:b.ranking,lengkap:b.lengkap,norm:b.normalisasi,berbobot:b.berbobot}))}));}

const A1=anak('a1','Ahmad'), A2=anak('a2','Budi'), A3=anak('a3','Citra');
const K1=kriteria('k1','benefit'), K2=kriteria('k2','cost'), K3=kriteria('k3','benefit');
const I1=indikator('i1','k1'), I2=indikator('i2','k2'), I3=indikator('i3','k3');
const J=(a,i,p)=>jawaban(a,i,p);

run('S1',{anakList:[],kriteriaList:[],indikatorList:[],jawabanList:[],bobot:[],ahpSiap:true});
run('S2',{anakList:[A1],kriteriaList:[K1],indikatorList:[I1],jawabanList:[J('a1','i1',3)],bobot:[1],ahpSiap:true});
run('S3',{anakList:[A1],kriteriaList:[K2],indikatorList:[I2],jawabanList:[J('a1','i2',3)],bobot:[1],ahpSiap:true});
run('S4',{anakList:[A1],kriteriaList:[K1,K2],indikatorList:[I1,I2],jawabanList:[J('a1','i1',3),J('a1','i2',2)],bobot:[0.6,0.4],ahpSiap:true});
run('S5',{anakList:[A1,A2],kriteriaList:[K1,K3],indikatorList:[I1,I3],jawabanList:[J('a1','i1',3),J('a1','i3',2),J('a2','i1',4),J('a2','i3',1)],bobot:[0.5,0.5],ahpSiap:true});
run('S6',{anakList:[A1,A2],kriteriaList:[K1,K2],indikatorList:[I1,I2],jawabanList:[J('a1','i1',3),J('a1','i2',2),J('a2','i1',4),J('a2','i2',1)],bobot:[0.6,0.4],ahpSiap:true});
run('S7',{anakList:[A1,A2],kriteriaList:[K1,K3],indikatorList:[I1,I3],jawabanList:[J('a1','i1',3),J('a1','i3',2),J('a2','i1',3),J('a2','i3',2)],bobot:[0.5,0.5],ahpSiap:true});
run('S8',{anakList:[A1,A2,A3],kriteriaList:[K1,K3],indikatorList:[I1,I3],jawabanList:[J('a1','i1',3),J('a1','i3',1),J('a2','i1',2),J('a2','i3',2),J('a3','i1',1),J('a3','i3',3)],bobot:[0.5,0.5],ahpSiap:true});
run('S9',{anakList:[A1,A2,A3],kriteriaList:[K1,K3],indikatorList:[I1,I3],jawabanList:[J('a1','i1',3),J('a1','i3',1),J('a2','i1',3),J('a2','i3',1),J('a3','i1',1),J('a3','i3',3)],bobot:[0.5,0.5],ahpSiap:true});
run('S10',{anakList:[A1],kriteriaList:[K1],indikatorList:[I1],jawabanList:[J('a1','i1',3)],bobot:[1],ahpSiap:false});
run('S11',{anakList:[A1],kriteriaList:[K1],indikatorList:[I1],jawabanList:[],bobot:[1],ahpSiap:false});
run('S12',{anakList:[A1],kriteriaList:[K1],indikatorList:[I1],jawabanList:[],bobot:[1],ahpSiap:true});
run('S13',{anakList:[A1,A2,A3],kriteriaList:[K1],indikatorList:[I1],jawabanList:[J('a1','i1',3),J('a2','i1',2)],bobot:[1],ahpSiap:true});
run('S14',{anakList:[anak('a1',null,{nama_panggilan:null,kode_anak:null})],kriteriaList:[K1],indikatorList:[I1],jawabanList:[],bobot:[1],ahpSiap:true});
run('S15',{anakList:[A1],kriteriaList:[],indikatorList:[I1],jawabanList:[J('a1','i1',3)],bobot:[],ahpSiap:true});
run('S16',{anakList:[A1],kriteriaList:[K1],indikatorList:[],jawabanList:[],bobot:[1],ahpSiap:true});
run('S17',{anakList:[A1,A2],kriteriaList:[K1,K3],indikatorList:[I1,I3],jawabanList:[J('a1','i1',3),J('a1','i3',2),J('a2','i1',4),J('a2','i3',1)],bobot:[],ahpSiap:true});
run('S18',{anakList:[A1],kriteriaList:[K1,K3],indikatorList:[I1,I3],jawabanList:[J('a1','i1',3),J('a1','i3',2)],bobot:[0.5],ahpSiap:true});
run('S19',{anakList:[A1],kriteriaList:[K1,K3],indikatorList:[I1,I3],jawabanList:[J('a1','i1',3),J('a1','i3',2)],bobot:[0.5,0.3,0.2],ahpSiap:true});
run('S20',{anakList:[A1,A2],kriteriaList:[K1],indikatorList:[I1],jawabanList:[J('a1','i1',0),J('a2','i1',0)],bobot:[1],ahpSiap:true});
run('S21',{anakList:[A1,A2,A3,anak('a4','Dedi'),anak('a5','Eka')],kriteriaList:[K1,K2,K3],indikatorList:[I1,I2,I3],jawabanList:[J('a1','i1',3),J('a1','i2',1),J('a1','i3',2),J('a2','i1',2),J('a2','i2',2),J('a2','i3',1),J('a3','i1',1),J('a3','i2',3),J('a3','i3',3),J('a4','i1',3),J('a4','i2',2),J('a4','i3',1),J('a5','i1',1),J('a5','i2',1),J('a5','i3',1)],bobot:[0.5,0.3,0.2],ahpSiap:true});
run('S22',{anakList:[A1],kriteriaList:[K1,K3],indikatorList:[I1,I3],jawabanList:[J('a1','i1',3),J('a1','i3',2)],bobot:[0.5,0.5],ahpSiap:true});
run('S23',{anakList:[anak('a1','Zaki'),anak('a2','Ani'),A3],kriteriaList:[K1],indikatorList:[I1],jawabanList:[J('a1','i1',3),J('a2','i1',2)],bobot:[1],ahpSiap:true});
run('S24',{anakList:[anak('a1','Budi'),anak('a2','Ani')],kriteriaList:[K1],indikatorList:[I1],jawabanList:[],bobot:[1],ahpSiap:true});
run('S25',{anakList:[A1],kriteriaList:[K1],indikatorList:[I1],jawabanList:[J('a1','i1',1),J('a1','i1',3)],bobot:[1],ahpSiap:true});
run('S26',{anakList:[A1,A2],kriteriaList:[K1,K2,K3],indikatorList:[I1,I2,I3],jawabanList:[J('a1','i1',3),J('a1','i2',1),J('a1','i3',2),J('a2','i1',2),J('a2','i2',2),J('a2','i3',1)],bobot:[0.4,0.3,0.3],ahpSiap:true});
