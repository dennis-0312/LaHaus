/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
    'N/log',
    'N/record',
    'N/search',
    'N/error',
    'N/task',
    '../../Reporte Presupuestal/controller/TS_Script_Controller'
], function (log, record, search, error, task, _controller) {

    const arregloTrimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
    const TEMPORALIDAD_TRIMESTRAL = 2;
    const CECO_NIVEL_CONTROL = 1;
    const CUENTA_NIVEL_CONTROL = 2;
    const CATEGORIA_NIVEL_CONTROL = 3;
    const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal'; //CO Configuración Presupuestal Search - CP PRODUCCION
    const mapReduceScriptId = 'customscript_ts_mr_journal'
    const custdeploy1 = 'customdeploy_ts_journal'

    const beforeLoad = (scriptContext) => {
        const objRecord = scriptContext.newRecord;
        if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.COPY) {
            let transaction = objRecord.getValue({ fieldId: 'ntype' });
            let config = getConfig(transaction);
            log.debug('config', config);
            if (config != 0) {
                // log.debug('config2', config);
                // log.debug('PRUEBA', objRecord.getValue('custbody_ts_tipo_de_cambio_presupuesto'));
                objRecord.setValue('custbody_lh_temporalidad_flag', config.temporalidad);
                objRecord.setValue('custbody_lh_nivel_control_flag', config.nivelControl);
            } else {
                objRecord.setValue('custbody_lh_temporalidad_flag', config);
            }
        }
    }


    function beforeSubmit(scriptContext) {
        const objRecord = scriptContext.newRecord;
        let temporalidad = objRecord.getValue('custbody_lh_temporalidad_flag');
        var numLines = objRecord.getLineCount({ sublistId: 'line' });

        if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
            let symbol = objRecord.getValue({ fieldId: 'currency' });
            let exchangeRatePPTO = _controller.getTipoCambio(symbol);
            objRecord.setValue('custbody_ts_tipo_de_cambio_presupuesto', exchangeRatePPTO.exchangeRate);

            let transaction = objRecord.getValue({ fieldId: 'ntype' });
            let config = getConfig(transaction);
            // log.debug('config', config);
            if (config != 0) {
                // log.debug('config2', config);
                log.debug('PRUEBA', objRecord.getValue('custbody_ts_tipo_de_cambio_presupuesto'));
                objRecord.setValue('custbody_lh_temporalidad_flag', config.temporalidad);
                objRecord.setValue('custbody_lh_nivel_control_flag', config.nivelControl);
            } else {
                objRecord.setValue('custbody_lh_temporalidad_flag', config);
            }
        }

        for (let i = 0; i < numLines; i++) {
            let AplicaPPTO = objRecord.getSublistValue({ sublistId: 'line', fieldId: 'custcollh_aplica_ppto', line: i });
            if (AplicaPPTO) {
                let nivelControl = parseInt(objRecord.getValue('custbody_lh_nivel_control_flag'));

                let criterioControl = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'department', line: i });
                let criterioControlCategoria = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_categoria_ppto_oc', line: i });

                switch (nivelControl) {
                    case CECO_NIVEL_CONTROL:
                        msgCriterio = 'No tiene presupuesto para este centro de costo.';
                        msgVacio = 'Debe ingresar un centro de costo.';
                        break;
                    case CUENTA_NIVEL_CONTROL:
                        msgCriterio = 'No tiene presupuesto para esta cuenta.';
                        msgVacio = 'Debe ingresar una cuenta.';
                        break;
                    case CATEGORIA_NIVEL_CONTROL:
                        msgVacio = 'Debe ingresar un centro de costo.';
                        if (criterioControlCategoria.length == 0) {
                            var myCustomError = error.create({
                                name: 'EventError',
                                message: 'Debe ingresar una categoría',
                                notifyOff: false
                            });
                            throw myCustomError;
                        }
                        msgCriterio = 'No tiene presupuesto para esta categoría.';

                        break;
                    default:
                        msgCriterio = 'Revisar la configuración del Nivel de Control.'
                        break;
                }

                if (typeof criterioControl != 'undefined') {
                    if (criterioControl.length == 0) {
                        var myCustomError = error.create({
                            name: 'EventError',
                            message: msgVacio,
                            notifyOff: false
                        });
                        throw myCustomError;
                    }
                }
            }
        }
    }


    function afterSubmit(context) {
        let objRecord = context.newRecord;
        let ordenId = objRecord.id;
        let temporalidad = objRecord.getValue({ fieldId: 'custbody_lh_temporalidad_flag' });
        let numLines = objRecord.getLineCount({ sublistId: 'line' });
        // var thirdID = record.submitFields({
        //     type: 'journalentry', id: ordenId,
        //     values: {
        //         'memo': 'categoria',
        //         'custcol_lh_ppto_flag ': 4
        //     }
        // });

        try {
            log.debug('ordenId', ordenId);
            let mrTask = task.create({ taskType: task.TaskType.MAP_REDUCE });
            mrTask.scriptId = mapReduceScriptId;
            mrTask.deploymentId = custdeploy1;
            mrTask.params = {
                'custscriptcustscript_param_journal': ordenId
            };
            let mrTaskId = mrTask.submit();
            log.debug('TokenTask', mrTaskId);
            // for (let i = 0; i < numLines; i++) {
            //     let AplicaPPTO = objRecord.getSublistValue({ sublistId: 'line', fieldId: 'custcollh_aplica_ppto', line: i });
            //     let date = objRecord.getValue({ fieldId: 'trandate' })
            //     date = sysDate(date);
            //     log.debug('date', date)

            //     let month = date.month;
            //     let tempo = 0;

            //     if (AplicaPPTO) {
            //         let nivelControl = parseInt(objRecord.getValue('custbody_lh_nivel_control_flag'));
            //         let criterioControl = objRecord.getSublistValue({ sublistId: 'line', fieldId: 'department', line: i });
            //         log.debug('criterioControl', criterioControl)
            //         if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
            //             //!const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
            //             for (let i in arregloTrimestre) {
            //                 let bloque = arregloTrimestre[i].includes(month.toString());
            //                 if (bloque == true) {
            //                     tempo = parseInt(i);
            //                     break;
            //                 }
            //             }
            //         }
            //         let presupuesto = 0;
            //         let categoria = 0;
            //         if (tempo <= 9) {
            //             tempo = 0 + tempo.toString();
            //         }
            //         let presupuestado = search.create({
            //             type: "customrecord_lh_categoriap_periodo",
            //             filters:
            //                 [
            //                     ["custrecord_lh_detalle_cppto_status", "anyof", "1"],
            //                     "AND",
            //                     ["custrecord_lh_detalle_cppto_categoria.custrecord_lh_cp_centro_costo", "anyof", criterioControl],
            //                     "AND",
            //                     ["custrecord_lh_detalle_cppto_anio.name", "haskeywords", date.year]
            //                 ],
            //             columns:
            //                 [
            //                     search.createColumn({ name: "custrecord_lh_detalle_cppto_categoria", label: "0 Categoría" }),
            //                     search.createColumn({ name: "custrecord_lh_detalle_cppto_" + tempo, label: "1 Trimestre" }),
            //                 ]
            //         });

            //         let resultCount = presupuestado.runPaged().count;
            //         if (resultCount != 0) {
            //             let result = presupuestado.run().getRange({ start: 0, end: 1 });
            //             categoria = result[0].getValue(presupuestado.columns[0]);
            //             presupuesto = parseFloat(result[0].getValue(presupuestado.columns[1]));
            //         }
            //         //objRecord.setSublistValue({ sublistId: 'line', fieldId: 'custcol_lh_ppto_flag', value: categoria, line: i });
            //         //record.submitFields({ type: 'journalentry', id: ordenId, values: { 'memo': 'cate', 'custcol_lh_ppto_flag': categoria } });
            //     }


            // }
        } catch (e) {
            log.debug('Error-sysDate', e);
        }

    }


    const sysDate = (date_param) => {
        try {
            let date = new Date(date_param);
            let month = date.getMonth() + 1; // jan = 0
            let year = date.getFullYear();
            month = month <= 9 ? '0' + month : month;
            return {
                month: month,
                year: year
            }
        } catch (e) {
            log.debug('Error-sysDate', e);
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
                // let desviacion = resultConfig[0].getValue({ name: "custrecord_lh_cp_desviacion_ppto" });
                let nivelControl = resultConfig[0].getValue({ name: "custrecord_lh_cp_nivel_control" });
                return {
                    temporalidad: temporalidad,
                    //desviacion: desviacion,
                    nivelControl: nivelControl
                }
            } else {
                return 0;
            }
        } catch (error) {
            log.error('Error-getConfig', error);
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
