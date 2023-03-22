    /**
    *@NApiVersion 2.0
    *@NScriptType UserEventScript
    */
define(['N/record', 'N/search','N/log','N/ui/dialog' ], function (record, search,log,dialog) {

var exports={};
function beforeLoad(context) {
    //all your Before Load actions will go in here.

    if(context.type==context.UserEventType.VIEW)
    {
        var currentRecordAux = context.newRecord;
        var id=currentRecordAux.type+'.'+currentRecordAux.id;

       // if(currentRecordAux.status=='A')
       
        context.form.addButton({id: 'custpage_enviarEmail', label: 'Email Aprobación', functionName: 'AccionenviarEmail("'+id+'")' });      
        context.form.clientScriptModulePath = 'SuiteScripts/ScriptDR/button_accion_enviarEmail.js';
        log.error('entra','si');
        //Add additional code
        
        //SOURCE: https://system.netsuite.com/app/help/helpcenter.nl?fid=section_4625445350.html


    }
}
  exports.beforeLoad=beforeLoad;
  return exports;


});

/*
scriptContext.form.addButton({
    id : 'custpage_factura_inicial',
    label : 'Pago inicial',
    functionName : ";; if(confirm('¿Desea Continuar con el pago inicial?')){nlapiSubmitField(nlapiGetRecordType(),nlapiGetRecordId(),'custbody_crear_pago_inicial','T')}; setWindowChanged(window,false);location.reload(true);"
});*/