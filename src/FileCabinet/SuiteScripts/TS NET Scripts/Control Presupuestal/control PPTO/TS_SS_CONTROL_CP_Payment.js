/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/log', 'N/search', 'N/runtime', 'N/record'], (log, search, runtime, record) => {
    const PO_ITEM_LINES_SEARCH = 'customsearch_co_po_item_lines'; //CO Purchase Order Item Lines - CP PRODUCCION
    const PO_EXPENSE_LINES_SEARCH = 'customsearch_co_po_expense_lines'; //CO Purchase Order Expense Lines - CP PRODUCCION
    const BP_PAYMENT_LINES_SEARCH = 'customsearch_co_bill_payments_apply_line'; //CO Bill Payments Apply Lines - CP PRODUCCION
    const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal'; //CO Configuración Presupuestal Search - CP PRODUCCION
    const CATEGORIA_PRESUPUESTO_SEARCH = 'customsearch_co_cetagoria_presupuesto'; //CO Categoría Presupuesto Search - CP PRODUCCION
    const ID_AÑO_SEARCH = 'customsearch_co_cp_anio'; //CO CP Año Search - CP PRODUCCION
    const CATEGORIA_PPTO_PERIODOS = 'customsearch_co_categoria_ppto_periodos'; //CO Categoria Presupuesto Periodos Search - CP PRODUCCION
    const TIPO_CAMBIO_SEARCH = 'customsearch_co_tipo_cambio'; //CO Tipo Cambio Search - CP PRODUCCION
    const DETALLE_TRANSACCION_SEARCH = 'customsearch_co_detalle_transac_search'; //CO Detalle Transacción Search - CP PRODUCCION
    const NON_INVENTORY_ITEM = 'NonInvtPart';
    const INVENTORY_ITEM = 'InvtPart';
    const SERVICE_ITEM = 'Service';
    const RESERVADO = 2;
    const COMPROMETIDO = 3;
    const EJECUTADO = 4;
    const PAGADO = 5;
    const TRANSFERIDO = 6;
    const DISPONIBLE = 7;
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
    const BILL_TRANSACTION = 'vendorbill';
    const BILL_CREDIT_TRANSACTION = 'vendorcredit';

    const execute = (context) => {
        try {
            let recordId = runtime.getCurrentScript().getParameter({ name: 'custscript_cp_payment_recordid' });
            let action = runtime.getCurrentScript().getParameter({ name: 'custscript_cp_payment_action' });
            log.debug('Params', recordId + ' - ' + action);
            let purchaseOrder = '';

            let objSearch = search.load({ id: BP_PAYMENT_LINES_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'internalId', operator: search.Operator.ANYOF, values: recordId });
            filters.push(filterOne);
            let result = objSearch.run().getRange({ start: 0, end: 400 });
            log.debug('Result', result);
            for (let i in result) {
                let monto = 0;
                let arrayDetalle = new Array();
                let arrayMulti = new Array();
                let billId = result[i].getValue({ name: "appliedtotransaction", summary: "GROUP" });
                let lookupFields = search.lookupFields({ type: search.Type.VENDOR_BILL, id: billId, columns: ['custbody_lh_categories_id_flag'] });
                let categoriesArray = JSON.parse(lookupFields.custbody_lh_categories_id_flag);
                log.debug('categoriesArray', categoriesArray);
                let suma = parseFloat(result[i].getValue({ name: "payingamount", join: "appliedToTransaction", summary: "SUM" }));
                if (suma > 0) {
                    let objSearch2 = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                    let filters2 = objSearch2.filters;
                    const filterOne2 = search.createFilter({ name: 'custrecord_lh_cp_dt_factura_relacionada', operator: search.Operator.ANYOF, values: billId });
                    filters2.push(filterOne2);
                    let result2 = objSearch2.run().getRange({ start: 0, end: 100 });
                    log.debug('Result2', result2);
                    purchaseOrder = result2[0].getValue({ name: "custrecord_lh_cp_dt_purchase_ord_related" });
                    for (let j in result2) {
                        let internalId = result2[j].getValue({ name: "internalId" });
                        for (let k in categoriesArray) {
                            let bloque = categoriesArray[k][0].includes(internalId);
                            if (bloque == true) {
                                log.debug('Monto a pagar', categoriesArray[k][1] + ' - ' + typeof categoriesArray[k][1]);
                                monto = categoriesArray[k][1];
                                break;
                            }
                        }
                        let ejecutado = parseFloat(result2[j].getValue({ name: "custrecord_lh_cp_dt_ejecutado" }));
                        let pagado = parseFloat(result2[j].getValue({ name: "custrecord_lh_cp_dt_pagado" }));
                        arrayDetalle.push(internalId);
                        record.submitFields({
                            type: DETALLE_TRANSACCION_RECORD,
                            id: internalId,
                            values: {
                                'custrecord_lh_cp_dt_ejecutado': ejecutado - monto,
                                'custrecord_lh_cp_dt_pagado': pagado + monto,
                                'custrecord_lh_cp_dt_estado_busqueda': PAGADO,
                                'custrecord_lh_cp_dt_accion_ppto': PAGADO
                            }
                        });
                        pptoPagado(internalId, monto);
                    }

                    if (purchaseOrder.length != 0) {
                        record.submitFields({
                            type: record.Type.PURCHASE_ORDER,
                            id: purchaseOrder,
                            values: {
                                'custbody_lh_cp_estado_ppto_oc': PAGADO,
                            }
                        });
                    }

                    record.submitFields({
                        type: record.Type.VENDOR_BILL,
                        id: billId,
                        values: {
                            'custbody_lh_cp_estado_ppto_oc': PAGADO,
                            'custbody_lh_payment_status_flag': 'paid',
                        }
                    });

                    for (let i in arrayDetalle) {
                        let detalleId = arrayDetalle[i];
                        let lookupFields2 = search.lookupFields({ type: DETALLE_TRANSACCION_RECORD, id: detalleId, columns: ['custrecord_lh_cp_dt_pago_relacionado'] });
                        lookupFields2 = lookupFields2.custrecord_lh_cp_dt_pago_relacionado;
                        if (lookupFields2.length > 0) {
                            for (let j in lookupFields2) {
                                arrayMulti.push(lookupFields2[j].value);
                            }
                            arrayMulti.push(recordId);
                        } else {
                            arrayMulti.push(recordId);
                        }
                        log.debug('arrayMulti', arrayMulti)
                        let detaR = record.submitFields({
                            type: DETALLE_TRANSACCION_RECORD,
                            id: detalleId,
                            values: {
                                'custrecord_lh_cp_dt_pago_relacionado': arrayMulti,
                            }
                        });
                        log.debug('Detalle-Transaction', 'Detalle: ' + detaR + ' actualizado.');
                    }
                }
            }
        } catch (error) {
            log.error('Error-execute', error)
        }
    }


    const pptoPagado = (recordId, monto) => {
        let action = '';
        let objPurchaseOrder = '';
        log.debug('Monto', monto);
        try {
            let param2 = 0;
            let statusEjecutado = '';
            let statusPagado = '';
            let montoEjecutado = 0;
            let montoPagado = 0;
            let purchaseOrder = '';

            let objRecord = record.load({ type: DETALLE_TRANSACCION_RECORD, id: recordId, isDynamic: true });
            purchaseOrder = objRecord.getValue('custrecord_lh_cp_dt_purchase_ord_related');

            if (purchaseOrder.length != 0) {
                log.debug('purchaseOrder', purchaseOrder);
                objPurchaseOrder = search.lookupFields({
                    type: search.Type.PURCHASE_ORDER,
                    id: purchaseOrder,
                    columns: ['trandate', 'custbody_lh_anio_id_flag', 'custbody_lh_temporalidad_flag']
                });
            } else {
                purchaseOrder = objRecord.getValue('custrecord_lh_cp_dt_factura_relacionada');
                log.debug('bilLOrder', purchaseOrder);
                ejecucionDirectaFlag = 1;
                objPurchaseOrder = search.lookupFields({
                    type: search.Type.VENDOR_BILL,
                    id: purchaseOrder,
                    columns: ['trandate', 'custbody_lh_anio_id_flag', 'custbody_lh_temporalidad_flag']
                });
            }
            let date = objPurchaseOrder.trandate;
            let month = getMonth(date);
            let year = objPurchaseOrder.custbody_lh_anio_id_flag;
            let temporalidad = objPurchaseOrder.custbody_lh_temporalidad_flag;
            let category = objRecord.getValue('custrecord_lh_cp_dt_category_ppto');
            let accion = objRecord.getValue('custrecord_lh_cp_dt_accion_ppto');
            action = objRecord.getText('custrecord_lh_cp_dt_accion_ppto');
            log.debug('Action', action);
            let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
            filters.push(filterOne);
            const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
            filters.push(filterThree);
            const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [EJECUTADO, PAGADO] });
            filters.push(filterTwo);
            param2 = monto;
            let result = objSearch.run().getRange({ start: 0, end: 5 });
            if (temporalidad == TEMPORALIDAD_MENSUAL || temporalidad == TEMPORALIDAD_TRIMESTRAL || temporalidad == TEMPORALIDAD_ANUAL) {
                for (let i in result) {
                    let lhStatus = result[i].getValue({ name: "custrecord_lh_detalle_cppto_status" });
                    if (lhStatus == PAGADO) {
                        statusPagado = result[i].getValue({ name: "internalId" });
                        montoPagado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                    } else if (lhStatus == EJECUTADO) {
                        statusEjecutado = result[i].getValue({ name: "internalId" });
                        montoEjecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                    }
                }

                montoPagado = montoPagado + param2;
                montoEjecutado = montoEjecutado - param2;
                log.debug('montoPagado', montoPagado + ' + ' + param2);
                log.debug('montoEjecutado', montoEjecutado + ' - ' + param2);

                let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusPagado, isDynamic: true });
                let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoPagado });
                openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                let saveRecord2 = openRecord2.save();
                let saveRecord3 = openRecord3.save();
                log.debug('Records', saveRecord2 + ' - ' + saveRecord3);
                //!USER EVENT
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
            }
        } catch (error) {
            log.error('Error-pptoPagado', error);
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


    const setTotalPpto = (_id_type_rec, _id_rec) => {
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
        execute: execute
    }
});
