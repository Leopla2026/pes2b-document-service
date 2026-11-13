const recognize=require('./recognize');
exports.parse=function parseRetencoesRecolher(text){
 const result=recognize(text);
 if(!result?.success)return {identificacao:{cnpj:null,competencia:null},documento:{tipo:'RELATORIO_RETENCOES_RECOLHER',origem:'DOMINIO',enviarAoCliente:false},resumo:{requerAnalise:true,motivos:result?.errors||['RELATORIO_NAO_RECONHECIDO']}};
 return {...result.data,documento:{tipo:'RELATORIO_RETENCOES_RECOLHER',origem:'DOMINIO',finalidade:'DETALHAMENTO_DAS_NOTAS',enviarAoCliente:true,opcional:true,informativo:true},resumo:{...result.data.resumo,requerAnalise:false,motivos:[]}};
};
