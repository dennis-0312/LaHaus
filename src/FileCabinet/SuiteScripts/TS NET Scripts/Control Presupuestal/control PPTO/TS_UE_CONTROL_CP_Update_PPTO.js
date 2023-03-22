/********************************************************************************************************************************************************
This script for LH - Detalle Transacción
/******************************************************************************************************************************************************** 
File Name: TS_UE_CONTROL_CP_Update_PPTO.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 17/07/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/task'], (log, search, record, task) => {
    const PO_ITEM_LINES_SEARCH = 'customsearch_co_po_item_lines'; //CO Purchase Order Item Lines - CP PRODUCCION
    const PO_EXPENSE_LINES_SEARCH = '';
    const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal'; //CO Configuración Presupuestal Search - CP PRODUCCION
    const CATEGORIA_PRESUPUESTO_SEARCH = 'customsearch_co_cetagoria_presupuesto'; //CO Categoría Presupuesto Search - CP PRODUCCION
    const ID_AÑO_SEARCH = 'customsearch_co_cp_anio'; //CO CP Año Search - CP PRODUCCION
    const CATEGORIA_PPTO_PERIODOS = 'customsearch_co_categoria_ppto_periodos'; //CO Categoria Presupuesto Periodos Search - CP PRODUCCION
    const TIPO_CAMBIO_SEARCH = 'customsearch_co_tipo_cambio'; //CO Tipo Cambio Search - CP PRODUCCION
    const NON_INVENTORY_ITEM = 'NonInvtPart';
    const INVENTORY_ITEM = 'InvtPart';
    const SERVICE_ITEM = 'Service';
    const RESERVADO = 2;
    const COMPROMETIDO = 3;
    const EJECUTADO = 4;
    const PAGADO = 5;
    const TRANSFERIDO = 6;
    const DISPONIBLE = 7;
    const ANULADO = 8;
    const DIRECTO = 10;
    const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
    const anual = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const TEMPORALIDAD_MENSUAL = 1;
    const TEMPORALIDAD_TRIMESTRAL = 2;
    const TEMPORALIDAD_ANUAL = 3;
    const TEMPORALIDAD_GLOBAL = 4;
    const DESVIACION_ADVERTENCIA = 1;
    const DESVIACION_BLOQUEO = 2;
    const ITEM_SUBLIST = 'item';
    const EXPENSE_SUBLIST = 'expense';
    const CATEGORIA_PERIODO_RECORD = 'customrecord_lh_categoriap_periodo';
    const DETALLE_TRANSACCION_RECORD = 'customrecord_lh_detalle_transaccion';
    const EXPENSE_REPORT_TYPE = 'ExpRept';
    const PURCHASE_ORDER_TYPE = 'purchord';
    const VENDOR_BILL_TYPE = 'vendbill';
    //context.UserEventType.CREATE
    //context.UserEventType.COPY
    //context.UserEventType.VIEW
    //context.UserEventType.EDIT

    const beforeLoad = (context) => {
        const eventType = context.type;
        let arrayM = new Array();
        // log.debug('EventType-beforeLoad', eventType);
        let lookupFields2 = search.lookupFields({ type: DETALLE_TRANSACCION_RECORD, id: context.newRecord.id, columns: ['custrecord_lh_cp_dt_factura_relacionada'] });
        log.debug('Multi', lookupFields2);
        lookupFields2 = lookupFields2.custrecord_lh_cp_dt_factura_relacionada;
        log.debug('Length', lookupFields2.length);
        // for (let i in lookupFields2) {
        //     arrayM.push(lookupFields2[i].value);
        // }
        // log.debug('Multi2', arrayM);




        // const objRecord = context.newRecord;
        // let strArrayValue = new Array();
        // strArrayValue[0] = -1;
        // // strArrayValue[1] = 81199;
        // if (context.type === context.UserEventType.EDIT) {
        //     objRecord.setValue('custrecord_lh_cp_dt_factura_relacionada', -1);
        //     let multi_select = objRecord.getValue('custrecord_lh_cp_dt_factura_relacionada');
        //     log.debug('Multi', multi_select);
        // }

        // strArrayValue[2] = "C";
        // record.submitFields({
        //     type: 'purchaseorder',
        //     id: 56,
        //     values: {
        //         custbody_multiselectfield: strArrayValue
        //     },
        //     options: {
        //         enableSourcing: false,
        //         ignoreMandatoryFields: true
        //     }
        // });
    }

    const beforeSubmit = (context) => { }


    const afterSubmit = (context) => {
        let contextRecord = context.newRecord;
        let action = '';
        let arregloTrimestre = 0;
        let suma = 0;
        let objPurchaseOrder = '';
        if (context.type === context.UserEventType.XEDIT) {
            try {
                log.debug('INICIO', 'INICIO-UPDATE ===========================');
                let recordId = contextRecord.id;
                let param1 = 0;
                let param2 = 0;
                let statusReservado = '';
                let statusComprometido = '';
                let statusEjecutado = '';
                let statusPagado = '';
                let statusTransferido = '';
                let statusDisponible = '';
                let montoReservado = 0;
                let montoComprometido = 0;
                let montoEjecutado = 0;
                let montoPagado = 0;
                let montoTransferido = 0;
                let montoDisponible = 0;
                let purchaseOrder = '';
                let ejecucionDirectaFlag = 0;
                let transactionType = 0;
                let internalidOC = 0;

                let objRecord = record.load({ type: DETALLE_TRANSACCION_RECORD, id: recordId, isDynamic: true });
                purchaseOrder = objRecord.getValue('custrecord_lh_cp_dt_purchase_ord_related');

                if (purchaseOrder.length != 0) {
                    log.debug('purchaseOrder', purchaseOrder);
                    objPurchaseOrder = search.lookupFields({
                        type: search.Type.PURCHASE_ORDER,
                        id: purchaseOrder,
                        columns: ['trandate', 'custbody_lh_anio_id_flag', 'custbody_lh_temporalidad_flag', 'type']
                    });
                } else {
                    purchaseOrder = objRecord.getValue('custrecord_lh_cp_dt_factura_relacionada');
                    log.debug('BillOrder', purchaseOrder);
                    ejecucionDirectaFlag = 1;
                    objPurchaseOrder = search.lookupFields({
                        type: search.Type.TRANSACTION,
                        id: purchaseOrder,
                        columns: ['trandate', 'custbody_lh_anio_id_flag', 'custbody_lh_temporalidad_flag', 'type']
                    });
                }
                transactionType = objPurchaseOrder.type[0].value;
                log.debug('Transaction', transactionType);
                let date = objPurchaseOrder.trandate;
                let month = getMonth(date);
                let year = objPurchaseOrder.custbody_lh_anio_id_flag;
                let temporalidad = objPurchaseOrder.custbody_lh_temporalidad_flag;
                let category = objRecord.getValue('custrecord_lh_cp_dt_category_ppto');
                let accion = objRecord.getValue('custrecord_lh_cp_dt_accion_ppto');
                action = objRecord.getText('custrecord_lh_cp_dt_accion_ppto');
                log.debug('Action', action + ' - ' + transactionType);
                let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
                let filters = objSearch.filters;
                const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
                filters.push(filterOne);
                const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
                filters.push(filterThree);
                if (accion == COMPROMETIDO) {
                    const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [RESERVADO, COMPROMETIDO, DISPONIBLE] });
                    filters.push(filterTwo);
                    param1 = parseFloat(objRecord.getValue('custrecord_lh_cp_dt_comprometido'));
                    //param2 = parseFloat(objRecord.getValue('custrecord_lh_cp_dt_disponible'));

                    let result = objSearch.run().getRange({ start: 0, end: 5 });
                    //log.debug('Result', result);
                    if (temporalidad == TEMPORALIDAD_MENSUAL || temporalidad == TEMPORALIDAD_TRIMESTRAL || temporalidad == TEMPORALIDAD_ANUAL) {
                        for (let i in result) {
                            let lhStatus = result[i].getValue({ name: "custrecord_lh_detalle_cppto_status" });
                            if (lhStatus == RESERVADO) {
                                statusReservado = result[i].getValue({ name: "internalId" });
                                montoReservado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            } else if (lhStatus == COMPROMETIDO) {
                                statusComprometido = result[i].getValue({ name: "internalId" });
                                montoComprometido = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            } else if (lhStatus == DISPONIBLE) {
                                statusDisponible = result[i].getValue({ name: "internalId" });
                                montoDisponible = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            }
                        }
                        let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusReservado, isDynamic: true });
                        let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusComprometido, isDynamic: true });
                        let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusDisponible, isDynamic: true });

                        montoReservado = montoReservado - param1;
                        montoComprometido = montoComprometido + param1;
                        montoDisponible = montoDisponible - param1;
                        //log.debug('Montos', montoReservado + ' - ' + montoComprometido + ' - ' + montoDisponible)

                        openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoReservado });
                        openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoComprometido });
                        openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                        let saveRecord1 = openRecord1.save();
                        let saveRecord2 = openRecord2.save();
                        let saveRecord3 = openRecord3.save();
                        //log.debug('Records', saveRecord1 + ' - ' + saveRecord2 + ' - ' + saveRecord3);
                        //!USER EVENT
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord1);
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
                    }
                }

                if (accion == ANULADO) { //! Anulado, cuando se anula la factura (VOID)
                    if (ejecucionDirectaFlag == 1) { //!DIRECTA
                        log.debug('Ejecución-Directa', 'Me ejecuté');
                        const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [EJECUTADO, DISPONIBLE] });
                        filters.push(filterTwo);
                        param2 = parseFloat(objRecord.getValue('custrecord_lh_cp_dt_disponible'));

                        let result = objSearch.run().getRange({ start: 0, end: 5 });
                        if (temporalidad == TEMPORALIDAD_MENSUAL || temporalidad == TEMPORALIDAD_TRIMESTRAL || temporalidad == TEMPORALIDAD_ANUAL) {
                            for (let i in result) {
                                let lhStatus = result[i].getValue({ name: "custrecord_lh_detalle_cppto_status" });
                                if (lhStatus == DISPONIBLE) {
                                    statusDisponible = result[i].getValue({ name: "internalId" });
                                    montoDisponible = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                                } else if (lhStatus == EJECUTADO) {
                                    statusEjecutado = result[i].getValue({ name: "internalId" });
                                    montoEjecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                                }
                            }
                            let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusDisponible, isDynamic: true });
                            let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });

                            montoDisponible = montoDisponible + param2;
                            if (montoEjecutado < param2) {
                                montoEjecutado = param2 - montoEjecutado;
                            } else {
                                montoEjecutado = montoEjecutado - param2;
                            }
                            openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                            openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                            let saveRecord2 = openRecord2.save();
                            let saveRecord3 = openRecord3.save();
                            log.debug('Records', saveRecord2 + ' - ' + saveRecord3);
                            //!USER EVENT
                            setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                            setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
                        }
                    }
                }

                if (accion == EJECUTADO && transactionType == EXPENSE_REPORT_TYPE) {
                    const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [RESERVADO, EJECUTADO, DISPONIBLE] });
                    filters.push(filterTwo);
                    param1 = parseFloat(objRecord.getValue('custrecord_lh_cp_dt_ejecutado'));
                    //param2 = parseFloat(objRecord.getValue('custrecord_lh_cp_dt_disponible'));
                    let result = objSearch.run().getRange({ start: 0, end: 5 });
                    //log.debug('Result', result);
                    if (temporalidad == TEMPORALIDAD_MENSUAL || temporalidad == TEMPORALIDAD_TRIMESTRAL || temporalidad == TEMPORALIDAD_ANUAL) {
                        for (let i in result) {
                            let lhStatus = result[i].getValue({ name: "custrecord_lh_detalle_cppto_status" });
                            if (lhStatus == RESERVADO) {
                                statusReservado = result[i].getValue({ name: "internalId" });
                                montoReservado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            } else if (lhStatus == EJECUTADO) {
                                statusEjecutado = result[i].getValue({ name: "internalId" });
                                montoEjecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            } else if (lhStatus == DISPONIBLE) {
                                statusDisponible = result[i].getValue({ name: "internalId" });
                                montoDisponible = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            }
                        }
                        let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusReservado, isDynamic: true });
                        let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                        let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusDisponible, isDynamic: true });

                        montoReservado = montoReservado - param1;
                        montoEjecutado = montoEjecutado + param1;
                        montoDisponible = montoDisponible - param1;
                        //log.debug('Montos', montoReservado + ' - ' + montoComprometido + ' - ' + montoDisponible)

                        openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoReservado });
                        openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                        openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                        let saveRecord1 = openRecord1.save();
                        let saveRecord2 = openRecord2.save();
                        let saveRecord3 = openRecord3.save();
                        log.debug('Records', saveRecord1 + ' - ' + saveRecord2 + ' - ' + saveRecord3 + ' --- Registros actualziados, OK!!');
                        //!USER EVENT
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord1);
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
                    }
                }

                if (accion == DIRECTO && transactionType == EXPENSE_REPORT_TYPE) {
                    const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [RESERVADO, EJECUTADO, DISPONIBLE, PAGADO] });
                    filters.push(filterTwo);
                    param1 = parseFloat(objRecord.getValue('custrecord_lh_cp_dt_ejecutado'));
                    param2 = parseFloat(objRecord.getValue('custrecord_lh_cp_dt_pagado'));
                    paramSum = param1 + param2;
                    let result = objSearch.run().getRange({ start: 0, end: 5 });
                    //log.debug('Result', result);
                    if (temporalidad == TEMPORALIDAD_MENSUAL || temporalidad == TEMPORALIDAD_TRIMESTRAL || temporalidad == TEMPORALIDAD_ANUAL) {
                        for (let i in result) {
                            let lhStatus = result[i].getValue({ name: "custrecord_lh_detalle_cppto_status" });
                            if (lhStatus == RESERVADO) {
                                statusReservado = result[i].getValue({ name: "internalId" });
                                montoReservado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            } else if (lhStatus == EJECUTADO) {
                                statusEjecutado = result[i].getValue({ name: "internalId" });
                                montoEjecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            } else if (lhStatus == DISPONIBLE) {
                                statusDisponible = result[i].getValue({ name: "internalId" });
                                montoDisponible = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            } else if (lhStatus == PAGADO) {
                                statusPagado = result[i].getValue({ name: "internalId" });
                                montoPagado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            }
                        }
                        let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusReservado, isDynamic: true });
                        let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                        let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusDisponible, isDynamic: true });
                        let openRecord4 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusPagado, isDynamic: true });

                        montoReservado = montoReservado - paramSum;
                        montoEjecutado = montoEjecutado + param1;
                        montoDisponible = montoDisponible - paramSum;
                        montoPagado = montoPagado + param2;
                        //log.debug('Montos', montoReservado + ' - ' + montoComprometido + ' - ' + montoDisponible)

                        openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoReservado });
                        openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                        openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                        openRecord4.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoPagado });
                        let saveRecord1 = openRecord1.save();
                        let saveRecord2 = openRecord2.save();
                        let saveRecord3 = openRecord3.save();
                        let saveRecord4 = openRecord4.save();
                        log.debug('Records', saveRecord1 + ' - ' + saveRecord2 + ' - ' + saveRecord3 + ' - ' + saveRecord4 + ' --- Registros actualziados, OK!!');
                        //!USER EVENT
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord1);
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord4);
                    }
                }

                log.debug('FIN', 'FIN-UPDATE ==============================');
            } catch (error) {
                log.debug('Error-beforeSubmit-' + action, error);
                log.debug('FIN', 'FIN-UPDATE ==============================');
            }
        }
    }


    const getMonth = (date) => {
        try {
            let month = parseInt(date.split('/')[1]);
            month = month <= 9 ? '0' + month : month;
            return month;
        } catch (error) {
            log.error('Error-getMonth', error);
        }

    }


    function setTotalPpto(_id_type_rec, _id_rec) {
        try {
            var recPeriod = record.load({ type: _id_type_rec, id: _id_rec });
            var mntTotalMes = 0.00;
            for (var j = 1; j <= 12; j++) {
                //log.debug('entra a iterar');
                if (j < 10) j = '0' + j;
                fieldMes = 'custrecord_lh_detalle_cppto_' + j;
                var mntMes = recPeriod.getValue(fieldMes) || 0.00;
                mntTotalMes += mntMes;
            }
            log.debug('mntTotalMes', mntTotalMes);
            record.submitFields({
                type: _id_type_rec,
                id: _id_rec,
                values: { 'custrecord_lh_detalle_cppto_total': mntTotalMes },
                options: { enableSourcing: false, ignoreMandatoryFields: true }
            });

        } catch (e) {
            log.error('Error en setTotalPpto', e.message);
        }

    }

    return {
        //beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});