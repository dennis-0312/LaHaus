/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/task',
    'N/runtime',
    '../../Reporte Presupuestal/controller/TS_Script_Controller'
], (log, search, record, task, runtime, _controller) => {
    const scriptObj = runtime.getCurrentScript();
    const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal';
    const CONTROL_PRESUPUESTAL_RESERVADO_PO = 'customsearch_control_ppto_reservado_po'; //Control Presupuestal RESERVADO PO - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_RESERVADO_ER = 'customsearch_control_ppto_reservado_er'; //Control Presupuestal RESERVADO ER - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_COMPROMETIDO = 'customsearch_control_ppto_comprometido'; //Control Presupuestal COMPROMETIDO - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_EJECUTADO = 'customsearch_control_ppto_ejecutado'; //Control Presupuestal EJECUTADO - PRODUCCIÓN
    const TIPO_CAMBIO_SEARCH = 'customsearch_co_tipo_cambio'; //CO Tipo Cambio Search - CP PRODUCCION
    const CATEGORIA_PPTO_PERIODOS = 'customsearch_co_categoria_ppto_periodos'; //CO Categoria Presupuesto Periodos Search - CP PRODUCCION
    const PRESUPUESTO_TRIMESTRAL = ''
    const arregloTrimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
    const anual = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const TEMPORALIDAD_MENSUAL = 1;
    const TEMPORALIDAD_TRIMESTRAL = 2;
    const TEMPORALIDAD_ANUAL = 3;
    const DESVIACION_ADVERTENCIA = 1;
    const DESVIACION_BLOQUEO = 2;
    const CECO_NIVEL_CONTROL = 1;
    const CUENTA_NIVEL_CONTROL = 2;
    const CATEGORIA_NIVEL_CONTROL = 3;
    const PARTIDA_PRESUPUESTAL_SEARCH = 'customsearch_partida_presupuestal'; //Partida Presupuestal - PRODUCCION
    let generalSolicitud = new Array();
    let typeMode = '';
    let cop = 0;
    let mxn = 0;

    function execute(context) {
        let id = scriptObj.getParameter({ name: 'custscript_param_purchaseorder' });
        let linea = scriptObj.getParameter({ name: 'custscript_param_purchaseorder_line' });
        log.debug('Params', 'ID:' + id + ' - ' + 'LINEA: ' + linea);
        let objRecord = record.load({ type: 'purchaseorder', id: id });
        let msgVacio = ''
        let idpartida;
        let temporalidad = objRecord.getValue('custbody_lh_temporalidad_flag');
        var numLines = objRecord.getLineCount({ sublistId: 'item' });
        let currency = objRecord.getValue('currency');
        let exchangeRate = _controller.getTipoCambio(currency);
        let rangeDates = '';
        let limitExceeded = 0;

        for (let i = parseInt(linea); i < numLines; i++) {
            let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
            log.debug('remainingUsage', remainingUsage + ' - ' + i);
            if (remainingUsage <= 100 || i == 325) {
                log.debug('Límite Excedido: ', remainingUsage + ' - ' + i);
                limitExceeded = 1
                linea = i
                break;
            }
            if (temporalidad != 0) {
                let status = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_approval_status', line: i });
                if (status == 1) {
                    let nivelControl = parseInt(objRecord.getValue('custbody_lh_nivel_control_flag'));
                    let desviacion = objRecord.getValue('custbody_lh_desviacion_flag');
                    let date = objRecord.getValue({ fieldId: 'trandate' });
                    date = sysDate(date); //! sysDate (FUNCTION)
                    let year = date.year

                    let month = date.month;
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
                                var myCustomError = error.create({ name: 'EventError', message: 'Debe ingresar una categoría', notifyOff: false });
                                throw myCustomError;
                            }
                            msgCriterio = 'No tiene presupuesto para este centro de costo.';
                            break;
                        default:
                            msgCriterio = 'Revisar la configuración del Nivel de Control.'
                            break;
                    }

                    if (criterioControl.length == 0) {
                        var myCustomError = error.create({ name: 'EventError', message: msgVacio, notifyOff: false });
                        throw myCustomError;
                    }
                    let quantity = parseInt(objRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }));
                    let quantityBilled = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantitybilled', line: i });
                    quantityBilled = typeof quantityBilled == 'undefined' ? 0 : parseInt(quantityBilled);
                    let rate = parseFloat(objRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }));
                    let solicitud = + ((quantity - quantityBilled) * rate) / exchangeRate.exchangeRate;
                    json = [criterioControl, quantity, quantityBilled, rate, status];

                    if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
                        //!const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
                        for (let i in arregloTrimestre) {
                            let bloque = arregloTrimestre[i].includes(month.toString());
                            if (bloque == true) {
                                tempo = parseInt(i);
                                break;
                            }
                        }
                        //log.debug('Tempo', tempo);
                        rangeDates = _controller.getQuaterly(tempo, year);
                    } else if (temporalidad == TEMPORALIDAD_MENSUAL) {
                        rangeDates = _controller.getMonthly(parseInt(month), year);
                    }

                    let partidaSearch = search.load({ id: PARTIDA_PRESUPUESTAL_SEARCH });
                    let filters = partidaSearch.filters;
                    const filterDepartment = search.createFilter({ name: 'custrecord_lh_cp_centro_costo', operator: search.Operator.ANYOF, values: criterioControl });
                    filters.push(filterDepartment);
                    if (nivelControl == CATEGORIA_NIVEL_CONTROL) {
                        const filterCategory = search.createFilter({ name: 'custrecord_lh_cp_nombre_categoria', operator: search.Operator.ANYOF, values: categoriaControl });
                        filters.push(filterCategory);
                    }

                    let searchResultCount = partidaSearch.runPaged().count;
                    if (searchResultCount != 0) {
                        let result = partidaSearch.run().getRange({ start: 0, end: 1 });
                        idpartida = result[0].getValue({ name: "internalid" });
                    }

                    let presupuestado = _controller.getPresupuestado(rangeDates.fdesde, rangeDates.fhasta, idpartida);
                    let reservado = _controller.getReservado(rangeDates.fdesde, rangeDates.fhasta, idpartida);
                    let comprometido = _controller.getComprometido(rangeDates.fdesde, rangeDates.fhasta, idpartida);
                    let ejecutado = _controller.getEjecutado(rangeDates.fdesde, rangeDates.fhasta, idpartida);
                    let disponible = parseFloat(presupuestado) - (parseFloat(reservado) + parseFloat(comprometido) + parseFloat(ejecutado));
                    let tengodisponible = disponible - solicitud;

                    log.debug('Debug', 'IDPartida: ' + idpartida + ' - ' + 'presupuestado: ' + presupuestado + ' - ' + 'solicitud: ' + solicitud + ' - ' + 'disponible: ' + disponible + ' - ' + 'tengodisponible: ' + tengodisponible);
                    objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_ppto_flag', value: idpartida, line: i });

                    if (disponible <= solicitud) {
                        i = i + 1;
                        log.debug('VOID', 'Cerrar Orden: ' + id);
                        let voidSalesOrderId = transaction.void({
                            type: transaction.Type.PURCHASE_ORDER, //disable Void Transactions Using Reversing Journals in Account Pref
                            id: salesOrderId
                        });
                        log.debug('VOID', 'Orden ' + id + ' - ' + voidSalesOrderId);
                    }
                }
            }
        }

        objRecord.setValue({ fieldId: 'custbody_run_mapreduce_linea', value: linea });
        let guardado = objRecord.save();
        log.debug('SAVE', guardado)

        // if (limitExceeded == 1) {
        //     objRecord.setValue({ fieldId: 'custbody_run_mapreduce', value: false });
        //     objRecord.save();
        //     // log.debug('Scheduled', 'Ejecuto SS: ' + id);
        //     // let scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
        //     // scriptTask.scriptId = 'customscript_ts_ss_purchaseorder';
        //     // scriptTask.deploymentId = 'customdeploy_ts_ss_purchaseorder';
        //     // scriptTask.params = {
        //     //     'custscript_param_purchaseorder': id,
        //     //     'custscript_param_purchaseorder_line': linea
        //     // };
        //     // let scriptTaskId = scriptTask.submit();
        //     // log.debug('TokenTask', scriptTaskId);
        // } else {
        //     objRecord.setValue({ fieldId: 'custbody_run_mapreduce', value: false });
        //     let guardado = objRecord.save();
        //     log.debug('Save', guardado)
        // }
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
        } catch (error) {
            log.debug('Error-sysDate', e);
        }
    }

    return {
        execute: execute
    }
});
