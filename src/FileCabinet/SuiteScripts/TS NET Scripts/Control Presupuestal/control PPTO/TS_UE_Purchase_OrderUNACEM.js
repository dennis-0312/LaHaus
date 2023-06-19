/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(['N/config','N/log', 'N/record', 'N/search', 'N/runtime', 'N/file', 'N/file','N/ui/serverWidget'], function (config,log, record, search, runtime, file, serverWidget) {

    const ITEM = 'item';
  
    const beforeLoad = (scriptContext) => {
       let configRecObj = config.load({ type: config.Type.COMPANY_INFORMATION });
        const URL = configRecObj.getValue({ fieldId: 'appurl' });
        log.debug(URL);
        let form = scriptContext.form;
        const objRecord = scriptContext.newRecord;
        const eventType = scriptContext.type;
        const typeTransaction = objRecord.type;
      	let aprobarType = 2;
        let rechazartype = 3;
       	var entity = objRecord.getValue({fieldId: 'entity'});
      	var id = objRecord.getValue({fieldId: 'id'});
       	var status = objRecord.getValue({fieldId: 'approvalstatus'});
      	var transtatus = objRecord.getValue({fieldId: 'transtatus'});
          var roll = objRecord.getValue({fieldId: 'custbody_au_rol_apro_oc'});
  		let nextAprobal = objRecord.getValue({fieldId: 'nextapprover'});
      
    	if (typeTransaction == 'custompurchasepayment_order') {
          	aprobarType = "C";
          rechazartype = "B";
           nextAprobal =objRecord.getValue({fieldId: 'custbody52'});
        }
     
      
      
        var userObj = runtime.getCurrentUser()
        var userId = userObj.id;
        var role = userObj.role;

        if(nextAprobal ==userId || roll == role){
          log.debug('nextAprobal',nextAprobal);
            if (typeTransaction == record.Type.PURCHASE_REQUISITION) {
                if (eventType === scriptContext.UserEventType.VIEW && status ==1) {
             if(id){
               form.addButton({
                  id: 'custpage_ts_aprobar_venta',
                  label: 'Aprobar',
                  functionName: 'aprobarrequisition(' + id + ',"' + nextAprobal + '","' + 2 + '")'
               });
               form.addButton({
                    id: 'custpage_ts_rechazar_venta',
                    label: 'Rechazar',
                    functionName: 'aprobarrequisition(' + id + ',"' + nextAprobal + '","' + 3 + '")'
                 });
                form.clientScriptModulePath = './NS_CL_aprobar.js';
             }
           
           }
         }else{
            if (eventType === scriptContext.UserEventType.VIEW && status ==1 || eventType === scriptContext.UserEventType.VIEW && transtatus =='A') {
                log.debug('id',id);
                log.debug('nextAprobal',nextAprobal);
                log.debug('roll',roll);
                log.debug('aprobarType',aprobarType);
                log.debug('typeTransaction',typeTransaction);
                log.debug('URL',URL);
                log.debug('role',role);
             if(id){
               form.addButton({
                  id: 'custpage_ts_aprobar_venta',
                  label: 'Aprobar',
                  functionName: 'aprobarVenta(' + id + ',"' + nextAprobal + '","' + roll + '","' + aprobarType + '","' + typeTransaction + '","' + URL + '","' + role + '")'
               });
               form.addButton({
                    id: 'custpage_ts_rechazar_venta',
                    label: 'Rechazar',
                    functionName: 'aprobarVenta(' + id + ',"' + nextAprobal + '","' + roll + '","' + rechazartype + '","' + typeTransaction + '","' + URL + '","' + role + '")'
                 });
                form.clientScriptModulePath = './NS_CL_aprobar.js';
             }
           
           }
         }
        }
       	
     
      	
        try {
            if (typeTransaction == record.Type.PURCHASE_ORDER) {
                if (eventType === scriptContext.UserEventType.CREATE) {
                 
                    log.error('entity', entity);
                    if (!entity) return;
                    objRecord.setValue('custbody61', entity);
                    log.error("termino beforeLoad");
                }
            }
        } catch (error) {
            log.error("error", error);
        }
    }

    const afterSubmit = (scriptContext) => {
        try {
            const objRecord = scriptContext.newRecord;
            const eventType = scriptContext.type;
            const transactionId = Number(objRecord.id);
            const typeTransaction = objRecord.type;

            if (typeTransaction == record.Type.PURCHASE_ORDER) {
                if (eventType === scriptContext.UserEventType.CREATE) {
                    var solicitudOrden = objRecord.getSublistValue({ sublistId: ITEM, fieldId: 'linkedorder', line: 0 });
                    log.error("solicitudOrden", solicitudOrden);
                    if (!solicitudOrden) return;
                    let solicitudOrdenRecord = search.lookupFields({
                        type: search.Type.PURCHASE_REQUISITION,
                        id: Number(solicitudOrden),
                        columns: ['custbody109']
                    });
                    let contratoServicioVinculado = solicitudOrdenRecord.custbody109;
                    log.error("contratoServicioVinculado", contratoServicioVinculado);
                    if (!contratoServicioVinculado.length) return;
                    record.submitFields({
                        type: record.Type.PURCHASE_ORDER,
                        id: transactionId,
                        values: {
                            'custbody_contrato_oc': Number(contratoServicioVinculado[0].value)
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                }
            }
        } catch (error) {
            log.error("There was an error in [aftersubmit] function", error);
        }
    }

    return {
        beforeLoad,
        afterSubmit
    }
});