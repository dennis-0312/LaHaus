/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/https', 'N/runtime'], (log, search, record, https, runtime) => {
    const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal'; //CO Configuración Presupuestal Search - CP PRODUCCION
    const PURCHASE_ORDER = 'purchaseorder';
    const VENDOR_BILL = 'vendorbill';
    const VENDOR_CREDIT = 'vendorcredit';
    const EXPENSE_REPORT = 'expensereport';
    const TRANSACTION_PURCHASE_ORDER = 15;

    const beforeLoad = (scriptContext) => {
        const objRecord = scriptContext.newRecord;
        //!Si se desea ingtresar transacciones retroactivas activar aquí editar
        if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.COPY) {
            const Dennis = 27160;
            try {
                let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                if (scriptContext.newRecord.type == PURCHASE_ORDER || scriptContext.newRecord.type == EXPENSE_REPORT) {
                    let transaction = objRecord.getValue({ fieldId: 'ntype' });
                    let config = getConfig(transaction);
                    if (config != 0) {
                        objRecord.setValue('custbody_lh_temporalidad_flag', config.temporalidad);
                        objRecord.setValue('custbody_lh_nivel_control_flag', config.nivelControl);
                        objRecord.setValue('custbody_lh_desviacion_flag', config.desviacion);
                    } else {
                        objRecord.setValue('custbody_lh_temporalidad_flag', config);
                    }

                    if (scriptContext.type === scriptContext.UserEventType.COPY && scriptContext.newRecord.type == PURCHASE_ORDER) {
                        let linecount = parseInt(objRecord.getLineCount({ sublistId: 'item' }));
                        for (let i = linecount - 1; i >= 0; i--) {
                            remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                            objRecord.removeLine({ sublistId: 'item', line: i, ignoreRecalc: true });
                            if (remainingUsage < 50) {
                                log.debug('Límité excedido', remainingUsage);
                                break;
                            }
                        }
                    }
                }

                if (scriptContext.newRecord.type == PURCHASE_ORDER) {
                    if (runtime.getCurrentUser().id == Dennis) {
                        //objRecord.setValue('entity', 35895);
                        objRecord.setValue('employee', Dennis);
                        objRecord.setValue('custbodylh_creador_oc', Dennis);
                        objRecord.setValue('custbodylh_aprobador', Dennis);
                    }
                } else if (scriptContext.newRecord.type == EXPENSE_REPORT) {
                    if (runtime.getCurrentUser().id == Dennis) {
                        objRecord.setValue('entity', Dennis);
                        objRecord.setValue('custbodylh_aprobador', Dennis);
                    }
                }
            } catch (error) {
                log.error('Error-BL', error);
            }
        }
    }


    const beforeSubmit = (scriptContext) => {
        const objRecord = scriptContext.newRecord;
        if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
            if (objRecord.type == VENDOR_BILL || objRecord.type == VENDOR_CREDIT) {
                try {
                    let date = objRecord.getValue({ fieldId: 'trandate' });
                    let year = sysDate(date); //! sysDate (FUNCTION)

                    let myRestletHeaders = new Array();
                    myRestletHeaders['Accept'] = '*/*';
                    myRestletHeaders['Content-Type'] = 'application/json';

                    let myUrlParameters = {
                        recordParameter: objRecord.id,
                        typeParameter: objRecord.type,
                        ntypeParameter: objRecord.getValue({ fieldId: 'ntype' }),
                        yearParameter: year
                    }

                    log.debug('Parameters', myUrlParameters);

                    let myRestletRequest = https.requestRestlet({
                        deploymentId: 'customdeploy_ts_rs_control_presupuestal',
                        scriptId: 'customscript_ts_rs_control_presupuestal',
                        headers: myRestletHeaders,
                        method: 'GET',
                        urlParams: myUrlParameters
                    });

                    // let myRestletResponse = myRestletRequest.code;
                    // log.debug('Response', myRestletResponse);
                } catch (error) {
                    log.error('Error-AS', error);
                }
            }
        }
    }


    const afterSubmit = (scriptContext) => {
        const objRecord = scriptContext.newRecord;
        if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
            if (objRecord.type == VENDOR_BILL) {
                //log.debug('Debug', 'Hola');
                try {
                    let date = objRecord.getValue({ fieldId: 'trandate' });
                    let year = sysDate(date); //! sysDate (FUNCTION)

                    let myRestletHeaders = new Array();
                    myRestletHeaders['Accept'] = '*/*';
                    myRestletHeaders['Content-Type'] = 'application/json';

                    let myUrlParameters = {
                        recordParameter: objRecord.id,
                        typeParameter: objRecord.type,
                        ntypeParameter: objRecord.getValue({ fieldId: 'ntype' }),
                        yearParameter: year
                    }

                    log.debug('Parameters', myUrlParameters);

                    let myRestletRequest = https.requestRestlet({
                        deploymentId: 'customdeploy_ts_rs_control_presupuestal',
                        scriptId: 'customscript_ts_rs_control_presupuestal',
                        headers: myRestletHeaders,
                        method: 'GET',
                        urlParams: myUrlParameters
                    });

                    // let myRestletResponse = myRestletRequest.code;
                    // log.debug('Response', myRestletResponse);
                } catch (error) {
                    log.error('Error-AS', error);
                }
            }
        }
    }


    const getConfig = (transaction) => {
        try {
            let objSearch = search.load({ id: CONFIG_PPTO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_cp_transaccion', operator: search.Operator.ANYOF, values: transaction });
            filters.push(filterOne);
            const filterThree = search.createFilter({ name: 'custrecord_lh_cp_flujo_aprobacion', operator: search.Operator.IS, values: true });
            filters.push(filterThree);

            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount != 0) {
                let resultConfig = objSearch.run().getRange({ start: 0, end: 1 });
                let temporalidad = resultConfig[0].getValue({ name: "custrecord_lh_cp_temporalidad" });
                let desviacion = resultConfig[0].getValue({ name: "custrecord_lh_cp_desviacion_ppto" });
                let nivelControl = resultConfig[0].getValue({ name: "custrecord_lh_cp_nivel_control" });
                return {
                    temporalidad: temporalidad,
                    desviacion: desviacion,
                    nivelControl: nivelControl
                }
            } else {
                return 0;
            }
        } catch (error) {
            log.error('Error-getConfig', error);
        }
    }


    const sysDate = (date_param) => {
        try {
            let date = new Date(date_param);
            let month = date.getMonth() + 1; // jan = 0
            let year = date.getFullYear();
            month = month <= 9 ? '0' + month : month;
            return year;
        } catch (e) {
            console.log('Error-sysDate', e);
        }
    }

    return {
        beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
