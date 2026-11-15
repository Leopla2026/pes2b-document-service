// Recognize only the original Domínio detail report; never infer identity from the filename.
function retentionReport(text,kind='RECOLHER'){
 const normalized=String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const title=new RegExp('RETENCOES\\s+A\\s+'+kind);const type='RELATORIO_RETENCOES_'+kind;
 if(!title.test(normalized))return null;
 const header=normalized.split(title)[0];
 const fail=code=>({success:false,documentType:type,engine:{parserExecuted:true,parserBlocked:true},errors:[code]});
 if(!/SISTEMA LICENCIADO PARA/.test(normalized)||!/TOTAL\s+GERAL/.test(normalized)||!(kind==='COMPENSAR'?/CLIENTE/:/FORNECEDOR/).test(normalized))return fail('RELATORIO_DOMINIO_INCOMPLETO');
 const cnpjs=[...new Set((header.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g)||[]).map(x=>x.replace(/\D/g,'')))];
 const periodHeader=header.split(/HORA\s*:|EMISSAO\s*:|PAGINA\s*:/)[0];
 const dates=periodHeader.match(/\d{2}\/\d{2}\/\d{4}/g)||[];
 if(cnpjs.length!==1||dates.length!==2||!/[Pp][Ee][Rr][Ii][Oo][Dd][Oo]/.test(header))return fail('IDENTIDADE_OU_PERIODO_AMBIGUO');
 // Client/supplier CNPJs in the table are not report owners. Validate each page header only.
 const headerStart=/CNPJ\s*:\s*(?:\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\s*)?PERIODO\s*:/g;
 const pages=[...normalized.matchAll(headerStart)];
 for(const page of pages){
   const tail=normalized.slice(page.index),titleAt=tail.search(title);
   if(titleAt<0)return fail('CABECALHO_SEM_TITULO');
   const pageHeader=tail.slice(0,titleAt);
   const owners=[...new Set((pageHeader.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g)||[]).map(x=>x.replace(/\D/g,'')))];
   if(owners.length!==1||owners[0]!==cnpjs[0])return fail('MULTIPLOS_CONTRIBUINTES');
   const period=pageHeader.split(/HORA\s*:|EMISSAO\s*:|PAGINA\s*:/)[0].match(/\d{2}\/\d{2}\/\d{4}/g)||[];
   if(period.length!==2||period[0]!==dates[0]||period[1]!==dates[1])return fail('PERIODOS_DIVERGENTES_ENTRE_PAGINAS');
 }
 const cnpj=cnpjs[0];if(/^(\d)\1+$/.test(cnpj))return fail('CNPJ_INVALIDO');
 const digit=(base,weights)=>{const rem=base.split('').reduce((sum,n,i)=>sum+Number(n)*weights[i],0)%11;return rem<2?0:11-rem;};
 if(digit(cnpj.slice(0,12),[5,4,3,2,9,8,7,6,5,4,3,2])!==Number(cnpj[12])||digit(cnpj.slice(0,13),[6,5,4,3,2,9,8,7,6,5,4,3,2])!==Number(cnpj[13]))return fail('CNPJ_INVALIDO');
 const [day,month,year]=dates[0].split('/'),[last,endMonth,endYear]=dates[1].split('/');
 if(day!=='01'||month!==endMonth||year!==endYear||Number(month)<1||Number(month)>12||Number(last)!==new Date(Date.UTC(Number(year),Number(month),0)).getUTCDate())return fail('PERIODO_NAO_MENSAL');
 return {success:true,documentType:type,engine:{parserExecuted:true,parserBlocked:false},errors:[],data:{identificacao:{cnpj,competencia:month+'/'+year},resumo:{opcional:true,finalidade:'Detalhamento das notas com retenções; não é guia de pagamento.'}}};
}
module.exports=retentionReport;
