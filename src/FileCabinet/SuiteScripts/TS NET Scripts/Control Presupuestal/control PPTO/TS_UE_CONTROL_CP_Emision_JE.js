/********************************************************************************************************************************************************
This script for Purchase Order 
/******************************************************************************************************************************************************** 
File Name: TS_UE_CONTROL_CP_Emision.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 13/07/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/runtime', 'N/task'], (log, search, record, runtime, task) => {
    const PO_ITEM_LINES_SEARCH = 'customsearch_co_po_item_lines'; //CO Purchase Order Item Lines - CP PRODUCCION
    const PO_ITEM_LINES_NO_GROUP_SEARCH = 'customsearch_co_po_item_lines_2' //CO Purchase Order Item Lines NO GROUP - CP PRODUCCION
    const PO_EXPENSE_LINES_SEARCH = 'customsearch_co_po_expense_lines'; //CO Purchase Order Expense Lines - CP PRODUCCION
    const BP_PAYMENT_LINES_SEARCH = 'customsearch_co_bill_payments_apply_line'; //CO Bill Payments Apply Lines - CP PRODUCCION
    const BP_PAYMENT_LINES_VOID_SEARCH = 'customsearch_co_bill_pay_apply_line_void'; //CO Bill Payments Apply Lines VOID - CP PRODUCCION
    const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal'; //CO Configuración Presupuestal Search - CP PRODUCCION
    const CATEGORIA_PRESUPUESTO_SEARCH = 'customsearch_co_cetagoria_presupuesto'; //CO Categoría Presupuesto Search - CP PRODUCCION
    const ID_AÑO_SEARCH = 'customsearch_co_cp_anio'; //CO CP Año Search - CP PRODUCCION
    const CATEGORIA_PPTO_PERIODOS = 'customsearch_co_categoria_ppto_periodos'; //CO Categoria Presupuesto Periodos Search - CP PRODUCCION
    const TIPO_CAMBIO_SEARCH = 'customsearch_co_tipo_cambio'; //CO Tipo Cambio Search - CP PRODUCCION
    const DETALLE_TRANSACCION_SEARCH = 'customsearch_co_detalle_transac_search'; //CO Detalle Transacción Search - CP PRODUCCION
    const PERIODO_SEARCH = 'customsearch_co_period_search'; //CO Period Search - CP PRODUCCION
    const JE_LINE_LINES_SEARCH = 'customsearch_co_je_line_lines';  //CO Journal Entries Line Lines - CP PRODUCCION
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
    const JOURNAL_SUBLIST = 'line'
    const CATEGORIA_PERIODO_RECORD = 'customrecord_lh_categoriap_periodo'
    const DETALLE_TRANSACCION_RECORD = 'customrecord_lh_detalle_transaccion';
    const CATEGORIA_PRESUPUESTO_RECORD = 'customrecord_lh_categoria_presupuesto';
    const PURCHASE_ORDER = 'purchaseorder';
    const VENDOR_BILL = 'vendorbill';
    const VENDOR_CREDIT = 'vendorcredit';
    const VENDOR_PAYMENT = 'vendorpayment';
    const EXPENSE_REPORT = 'expensereport';
    const JOURNAL_ENTRY = 'journalentry';
    const CECO_NIVEL_CONTROL = 1;
    const CUENTA_NIVEL_CONTROL = 2;
    const CATEGORIA_NIVEL_CONTROL = 3;
    const CURRENCY_COP = 1;
    const CURRENCY_US_DOLLAR = 2;
    const CURRENCY_CANADIAN_DOLLAR = 3;
    const CURRENCY_EURO = 4;
    const CURRENCY_PESOS_MEXICANOS = 5;
    const CURRENCY_REAL_BRASILEÑO = 6;
    const TRANSACTION_PURCHASE_ORDER = 15;
    const TRANSACTION_VENDOR_BILL = 17;
    const TRANSACTION_EXPENSE_REPORT = 28;
    const TRANSACTION_JOURNAL_ENTRY = 1;
    const EXPENSE_REPORT_TYPE = 'ExpRept';
    const VENDOR_BILL_TYPE = 'VendBill';

    const beforeLoad = (context) => {
        log.debug('Event', context.type);
        log.debug('Type', context.newRecord.type);
        if (context.type === context.UserEventType.VIEW) {
            if (context.newRecord.type == VENDOR_PAYMENT) {
                // try {
                //     let objSearch = search.load({ id: BP_PAYMENT_LINES_VOID_SEARCH });
                //     let filters = objSearch.filters;
                //     const filterOne = search.createFilter({ name: 'internalId', operator: search.Operator.ANYOF, values: context.newRecord.id });
                //     filters.push(filterOne);
                //     let result = objSearch.run().getRange({ start: 0, end: 50 });
                //     log.debug('Result', result);
                // } catch (error) {
                //     log.error('Error-beforeLoad', error);
                // }
                let idDelete = "83041";
                const jsLibraries = [["83040", "505", 4500], ["83041", "505", 4500], ["83042", "505", 4500], ["83043", "505", 4500], ["83044", "505", 4500]]
                for (let i in jsLibraries) {
                    let exist = jsLibraries[i][0].includes(idDelete);
                    if (exist == true) {
                        jsLibraries.splice(i, 1);
                    }
                }
                log.debug('Splice', jsLibraries);
            }
        }
    }


    const beforeSubmit = (context) => {
        if (context.type === context.UserEventType.EDIT) {
            const objRecord = context.newRecord;

            if (objRecord.type == PURCHASE_ORDER) {
                let isJEVoid = context.newRecord.getValue({ fieldId: 'void' });
                log.debug("beforeSubmit-void", isJEVoid);
                if (isJEVoid) {
                    log.debug('INICIO', 'INICIO PURCHASE_ORDER VOID ====================================');
                    let objRecord = record.load({ type: record.Type.PURCHASE_ORDER, id: context.newRecord.id, isDynamic: true });
                    let estadoPPTO = objRecord.getValue({ fieldId: 'custbody_lh_cp_estado_ppto_oc' });

                    if (estadoPPTO == RESERVADO) {
                        try {
                            let year = objRecord.getValue({ fieldId: 'custbody_lh_anio_id_flag' });
                            if (year.length != 0) {
                                log.debug('Delete', 'Entré a eliminar desde void reservado');
                                let date = objRecord.getValue({ fieldId: 'trandate' });
                                date = sysDate(date); //! sysDate (FUNCTION)
                                let month = date.month;
                                let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                                let filters = objSearch.filters;
                                const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: context.newRecord.id });
                                filters.push(filterOne);

                                let result = objSearch.run().getRange({ start: 0, end: 100 });
                                log.debug('Results-Delete', result);
                                for (let i in result) {
                                    let internalid = result[i].getValue({ name: "internalId" });
                                    let reservado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_reservado" }));
                                    let category = result[i].getValue({ name: "custrecord_lh_cp_dt_category_ppto" });
                                    let exeReverse = executeReverseReservado(category, year, month, reservado);
                                    if (exeReverse == 1) {
                                        let featureRecord = record.delete({ type: DETALLE_TRANSACCION_RECORD, id: internalid });
                                        log.debug('Delete', 'Detalle: ' + featureRecord + ' delete');
                                    }
                                }
                            }
                        } catch (error) {
                            log.debug('Error-beforeSubmit', error);
                            log.debug('ERROR-RESERVADO', 'FIN PURCHASE_ORDER VOID =======================================');
                        }
                    }

                    if (estadoPPTO == COMPROMETIDO) {
                        try {
                            let year = objRecord.getValue({ fieldId: 'custbody_lh_anio_id_flag' });
                            if (year.length != 0) {
                                log.debug('Delete', 'Entré a eliminar desde void comprometido');
                                let date = objRecord.getValue({ fieldId: 'trandate' });
                                date = sysDate(date); //! sysDate (FUNCTION)
                                let month = date.month;
                                let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                                let filters = objSearch.filters;
                                const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: context.newRecord.id });
                                filters.push(filterOne);
                                let result = objSearch.run().getRange({ start: 0, end: 100 });
                                log.debug('Results-Delete', result);
                                for (let i in result) {
                                    let internalid = result[i].getValue({ name: "internalId" });
                                    let comprometido = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_comprometido" }));
                                    let category = result[i].getValue({ name: "custrecord_lh_cp_dt_category_ppto" });
                                    let exeReverse = executeReverseComprometido(category, year, month, comprometido);
                                    if (exeReverse == 1) {
                                        let featureRecord = record.delete({ type: DETALLE_TRANSACCION_RECORD, id: internalid });
                                        log.debug('Delete', 'Detalle: ' + featureRecord + ' delete');
                                    }
                                }
                                objRecord.setValue('custbody_lh_cp_estado_ppto_oc', 2);
                            }
                        } catch (error) {
                            log.debug('Error-beforeSubmit', error);
                            log.debug('ERROR-COMPROMETIDO', 'FIN PURCHASE_ORDER VOID =======================================');
                        }
                    }
                    log.debug('FIN', 'FIN PURCHASE_ORDER VOID =======================================');
                } else {
                    let estadoPPTO = objRecord.getValue({ fieldId: 'custbody_lh_cp_estado_ppto_oc' });
                    let estadoPPTOTXT = objRecord.getText({ fieldId: 'custbody_lh_cp_estado_ppto_oc' });
                    let updateFlag = objRecord.getValue({ fieldId: 'custbody_lh_update_flag' });
                    log.debug('ExecuteAction', estadoPPTOTXT + ' - ' + updateFlag);
                    // log.debug('updateFlag1', updateFlag);
                    if (estadoPPTO == RESERVADO && updateFlag == 1) {
                        log.debug('INICIO', 'INICIO PURCHASE_ORDER EDIT BEFORE ====================================');
                        try {
                            let year = objRecord.getValue({ fieldId: 'custbody_lh_anio_id_flag' });
                            if (year.length != 0) {
                                log.debug('Delete', 'Entré a eliminar');
                                let date = objRecord.getValue({ fieldId: 'trandate' });
                                date = sysDate(date); //! sysDate (FUNCTION)
                                let month = date.month;
                                let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                                let filters = objSearch.filters;
                                const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: objRecord.id });
                                filters.push(filterOne);

                                let result = objSearch.run().getRange({ start: 0, end: 100 });
                                log.debug('Results-Delete', result);
                                for (let i in result) {
                                    let internalid = result[i].getValue({ name: "internalId" });
                                    let reservado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_reservado" }));
                                    let category = result[i].getValue({ name: "custrecord_lh_cp_dt_category_ppto" });
                                    let exeReverse = executeReverseReservado(category, year, month, reservado);
                                    if (exeReverse == 1) {
                                        let featureRecord = record.delete({ type: DETALLE_TRANSACCION_RECORD, id: internalid });
                                        log.debug('Delete', 'Detalle: ' + featureRecord + ' delete');
                                    }
                                }
                            }
                        } catch (error) {
                            log.debug('Error-beforeSubmit', error);
                        }
                        log.debug('FIN', 'FIN PURCHASE_ORDER EDIT BEFORE ====================================');
                    }

                    if (estadoPPTO == COMPROMETIDO && updateFlag == 1) {
                        log.debug('INICIO', 'INICIO PURCHASE_ORDER EDIT BEFORE ====================================');
                        try {
                            let year = objRecord.getValue({ fieldId: 'custbody_lh_anio_id_flag' });
                            if (year.length != 0) {
                                log.debug('Delete', 'Entré a eliminar por edición');
                                let date = objRecord.getValue({ fieldId: 'trandate' });
                                date = sysDate(date); //! sysDate (FUNCTION)
                                let month = date.month;
                                let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                                let filters = objSearch.filters;
                                const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: objRecord.id });
                                filters.push(filterOne);
                                let result = objSearch.run().getRange({ start: 0, end: 100 });
                                log.debug('Results-Delete', result);
                                for (let i in result) {
                                    let internalid = result[i].getValue({ name: "internalId" });
                                    let comprometido = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_comprometido" }));
                                    let category = result[i].getValue({ name: "custrecord_lh_cp_dt_category_ppto" });
                                    let exeReverse = executeReverseComprometido(category, year, month, comprometido);
                                    if (exeReverse == 1) {
                                        let featureRecord = record.delete({ type: DETALLE_TRANSACCION_RECORD, id: internalid });
                                        log.debug('Delete', 'Detalle: ' + featureRecord + ' delete');
                                    }
                                }
                                objRecord.setValue('custbody_lh_cp_estado_ppto_oc', 2);
                            }
                        } catch (error) {
                            log.debug('Error-beforeSubmit', error);
                        }
                        log.debug('FIN', 'FIN PURCHASE_ORDER EDIT BEFORE ====================================');
                    }
                }
            }

            if (objRecord.type == VENDOR_BILL) {
                let isJEVoid = context.newRecord.getValue({ fieldId: 'void' });
                log.debug("beforeSubmit-void", isJEVoid);
                if (isJEVoid) {
                    let objRecord = record.load({ type: record.Type.VENDOR_BILL, id: context.newRecord.id, isDynamic: true });
                    let vienedeOC = objRecord.getValue('custbody_lh_create_from_flag');
                    log.debug('vienedeOC-Length-beforeSubmit', vienedeOC + ' - ' + vienedeOC.length);
                    if (vienedeOC.length > 0) {
                        log.debug('INICIO', 'INICIO VENDOR_BILL VOID ====================================');
                        log.debug('Void', 'Entré a void en beforeSubmit porque vengo desde OC');
                        let json = new Array();
                        let arrayDetalle = new Array();
                        let subList = '';
                        let tipoCambio = 1;
                        let arrayMulti = new Array();
                        let accionFlag = '';
                        let accionFlag2 = '';

                        let temporalidad = objRecord.getValue({ fieldId: 'custbody_lh_temporalidad_flag' });
                        if (temporalidad != 0) {
                            let currency = objRecord.getValue('currency');
                            subList = objRecord.getValue({ fieldId: 'custbody_lh_sublist_type_flag' });
                            let subsidiary = objRecord.getValue({ fieldId: 'subsidiary' });
                            let date = objRecord.getValue({ fieldId: 'trandate' });
                            date = sysDate(date); //! sysDate (FUNCTION)
                            if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                                tipoCambio = getTipoCambio(subsidiary, date.month, date.year); //! getTipoCambio (FUNCTION)
                            }
                            let numLines = objRecord.getLineCount({ sublistId: subList });
                            for (let i = 0; i < numLines; i++) {
                                let amount = objRecord.getSublistValue({ sublistId: subList, fieldId: 'amount', line: i });
                                let category = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcol_lh_ppto_flag', line: i });
                                json.push({
                                    category: category,
                                    amount: amount
                                });
                            }
                            let categorias = json.map((x) => x.category);
                            let arrayCategorias = [...new Set(categorias)];
                            let arrayMontos = [];
                            arrayCategorias.forEach((cat) => {
                                let filtro = json.filter((x) => x.category == cat);
                                let montos = filtro.reduce((acc, valor) => acc + valor.amount, 0);
                                arrayMontos.push(montos);
                            });
                            log.debug('arrayCategorias', arrayCategorias);
                            log.debug('arrayMontos', arrayMontos);
                            for (let j in arrayCategorias) {
                                let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                                let filters = objSearch.filters;
                                const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_factura_relacionada', operator: search.Operator.ANYOF, values: context.newRecord.id });
                                filters.push(filterOne);
                                const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_dt_category_ppto', operator: search.Operator.ANYOF, values: arrayCategorias[j] });
                                filters.push(filterTwo);
                                let result = objSearch.run().getRange({ start: 0, end: 5 });
                                for (let i in result) {
                                    let monto = parseFloat(arrayMontos[j]) / tipoCambio;
                                    let internalId = result[i].getValue({ name: "internalId" });
                                    let estado = result[i].getValue({ name: "custrecord_lh_cp_dt_estado_busqueda" });
                                    let comprometido = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_comprometido" }));
                                    let ejecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_ejecutado" })); //TODO Por si hay ejecutaod parcial sume y no setee

                                    ejecutado = ejecutado - monto;
                                    comprometido = comprometido + monto;

                                    if (estado == PAGADO) {
                                        accionFlag = PAGADO
                                        accionFlag2 = PAGADO
                                    } else {
                                        if (ejecutado == 0) {
                                            accionFlag = COMPROMETIDO
                                            accionFlag2 = ANULADO
                                        } else {
                                            accionFlag = EJECUTADO
                                            accionFlag2 = EJECUTADO
                                        }
                                    }

                                    arrayDetalle.push(internalId);
                                    record.submitFields({
                                        type: DETALLE_TRANSACCION_RECORD,
                                        id: internalId,
                                        values: {
                                            'custrecord_lh_cp_dt_ejecutado': ejecutado,
                                            'custrecord_lh_cp_dt_comprometido': comprometido,
                                            'custrecord_lh_cp_dt_estado_busqueda': accionFlag,
                                            'custrecord_lh_cp_dt_accion_ppto': accionFlag2
                                        }
                                    });
                                    pptoAnulado(internalId, monto);
                                }
                            }

                            record.submitFields({
                                type: record.Type.PURCHASE_ORDER,
                                id: vienedeOC,
                                values: {
                                    'custbody_lh_cp_estado_ppto_oc': accionFlag,
                                }
                            });

                            for (let i in arrayDetalle) {
                                let detalleId = arrayDetalle[i];
                                let lookupFields2 = search.lookupFields({ type: DETALLE_TRANSACCION_RECORD, id: detalleId, columns: ['custrecord_lh_cp_dt_factura_relacionada'] });
                                lookupFields2 = lookupFields2.custrecord_lh_cp_dt_factura_relacionada;
                                for (let j in lookupFields2) {
                                    if (lookupFields2[j].value != context.newRecord.id) {
                                        arrayMulti.push(lookupFields2[j].value);
                                    }
                                }
                                log.debug('arrayMulti', arrayMulti);
                                let detaR = record.submitFields({
                                    type: DETALLE_TRANSACCION_RECORD,
                                    id: detalleId,
                                    values: {
                                        'custrecord_lh_cp_dt_factura_relacionada': arrayMulti,
                                    }
                                });
                                log.debug('Detalle-Transaction', 'Detalle: ' + detaR + ' actualizado.');
                            }
                        }
                        log.debug('FIN', 'FIN VENDOR_BILL VOID =======================================');
                    }
                } else {
                    let monto = 0;
                    let estadoPPTO = objRecord.getValue({ fieldId: 'custbody_lh_cp_estado_ppto_oc' });
                    let estadoPPTOTXT = objRecord.getText({ fieldId: 'custbody_lh_cp_estado_ppto_oc' });
                    let updateFlag = objRecord.getValue({ fieldId: 'custbody_lh_update_flag' });
                    let arrayCategorias = JSON.parse(objRecord.getValue({ fieldId: 'custbody_lh_categories_id_flag' }));
                    let createdfrom = objRecord.getValue({ fieldId: 'custbody_lh_create_from_flag' });
                    log.debug('ExecuteAction', estadoPPTOTXT + ' - ' + updateFlag);
                    if (estadoPPTO == EJECUTADO && updateFlag == 1) {
                        log.debug('INICIO', 'INICIO VENDOR_BILL EDIT BEFORE ====================================');
                        try {
                            let year = objRecord.getValue({ fieldId: 'custbody_lh_anio_id_flag' });
                            if (year.length != 0) {
                                log.debug('Delete', 'Entré a eliminar');
                                let date = objRecord.getValue({ fieldId: 'trandate' });
                                date = sysDate(date); //! sysDate (FUNCTION)
                                let month = date.month;
                                let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                                let filters = objSearch.filters;
                                const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_factura_relacionada', operator: search.Operator.ANYOF, values: objRecord.id });
                                filters.push(filterOne);
                                let result = objSearch.run().getRange({ start: 0, end: 100 });
                                log.debug('Results-Delete', result);
                                for (let i in result) {
                                    let internalid = result[i].getValue({ name: "internalId" });
                                    for (let k in arrayCategorias) {
                                        if (arrayCategorias[k][0] == internalid) {
                                            monto = parseFloat(arrayCategorias[k][1]);
                                            break;
                                        }
                                    }
                                    let category = result[i].getValue({ name: "custrecord_lh_cp_dt_category_ppto" });
                                    let comprometido = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_comprometido" }));
                                    let ejecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_ejecutado" }));
                                    let exeReverse = executeReverseComprometido(category, year, month, monto, VENDOR_BILL, createdfrom); //!Para factura realiza la reversa de ejecutado
                                    if (exeReverse == 1 && createdfrom.length == 0) {
                                        let featureRecord = record.delete({ type: DETALLE_TRANSACCION_RECORD, id: internalid });
                                        log.debug('Delete', 'Detalle: ' + featureRecord + ' delete');
                                    } else {
                                        record.submitFields({
                                            type: DETALLE_TRANSACCION_RECORD,
                                            id: internalid,
                                            values: {
                                                'custrecord_lh_cp_dt_comprometido': comprometido + monto,
                                                'custrecord_lh_cp_dt_ejecutado': ejecutado - monto,
                                            }
                                        });
                                    }
                                }
                            }
                        } catch (error) {
                            log.debug('Error-beforeSubmit', error);
                            log.debug('ERROR', 'FIN VENDOR_BILL EDIT BEFORE ====================================');
                        }
                    } else {
                        log.debug('Saved-Edit', 'Me guarde sin modificar');
                    }
                    log.debug('FIN', 'FIN VENDOR_BILL EDIT BEFORE ====================================');
                }
            }

            if (objRecord.type == EXPENSE_REPORT) {
                let isJEVoid = context.newRecord.getValue({ fieldId: 'void' });
                log.debug("beforeSubmit-void", isJEVoid);
                if (isJEVoid) {
                    try {
                        log.debug('INICIO', 'INICIO EXPENSE_REPORT VOID ====================================');
                        let objRecord = record.load({ type: record.Type.EXPENSE_REPORT, id: context.newRecord.id, isDynamic: true });
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
                        let action = '';

                        let statusPPTo = objRecord.getValue('custbody_lh_cp_estado_ppto_oc');
                        let date = objRecord.getValue('trandate');
                        let month = sysDate(date);
                        month = month.month;
                        let year = objRecord.getValue('custbody_lh_anio_id_flag');
                        let temporalidad = objRecord.getValue('custbody_lh_temporalidad_flag');
                        let monto = parseFloat(objRecord.getValue('custbody_lh_amount_flag'));
                        let arrayCategorias = JSON.parse(objRecord.getValue('custbody_lh_categories_id_flag'));

                        for (let i in arrayCategorias) {
                            let objRec = record.load({ type: DETALLE_TRANSACCION_RECORD, id: arrayCategorias[i][0], isDynamic: true });
                            // let internalidDet = objRec.getValue('internalid');
                            let category = objRec.getValue('custrecord_lh_cp_dt_category_ppto');
                            let accion = objRec.getValue('custrecord_lh_cp_dt_accion_ppto');
                            action = objRec.getText('custrecord_lh_cp_dt_accion_ppto');
                            log.debug('Action', action);
                            let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
                            let filters = objSearch.filters;
                            const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
                            filters.push(filterOne);
                            const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
                            filters.push(filterThree);
                            if (statusPPTo == RESERVADO) {
                                const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [RESERVADO] });
                                filters.push(filterTwo);

                                param2 = monto;
                                let result = objSearch.run().getRange({ start: 0, end: 5 });
                                if (temporalidad == TEMPORALIDAD_MENSUAL || temporalidad == TEMPORALIDAD_TRIMESTRAL || temporalidad == TEMPORALIDAD_ANUAL) {
                                    for (let i in result) {
                                        let lhStatus = result[i].getValue({ name: "custrecord_lh_detalle_cppto_status" });
                                        if (lhStatus == RESERVADO) {
                                            statusReservado = result[i].getValue({ name: "internalId" });
                                            montoReservado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                                        }
                                    }

                                    montoReservado = montoReservado - param2;

                                    let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusReservado, isDynamic: true });
                                    openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoReservado });
                                    let saveRecord1 = openRecord1.save();
                                    log.debug('Records', saveRecord1);

                                    //!USER EVENT
                                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord1);

                                    record.submitFields({
                                        type: DETALLE_TRANSACCION_RECORD,
                                        id: arrayCategorias[i][0],
                                        values: {
                                            'custrecord_lh_cp_dt_category_ppto': '',
                                            'custrecord_lh_cp_dt_estado_busqueda': ANULADO,
                                            'custrecord_lh_cp_dt_factura_relacionada': '',
                                        }
                                    });
                                    log.debug('Proceso-Anulación', 'Transacción ' + context.newRecord.id + ' con detalle: ' + arrayCategorias[i][0] + ' anulado');
                                }
                            } else if (statusPPTo == EJECUTADO) {
                                const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [EJECUTADO, DISPONIBLE] });
                                filters.push(filterTwo);
                                param2 = monto;
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
                                    montoEjecutado = montoEjecutado - param2;

                                    openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                                    openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                                    let saveRecord2 = openRecord2.save();
                                    let saveRecord3 = openRecord3.save();
                                    log.debug('Records', saveRecord2 + ' - ' + saveRecord3);

                                    //!USER EVENT
                                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);

                                    record.submitFields({
                                        type: DETALLE_TRANSACCION_RECORD,
                                        id: arrayCategorias[i][0],
                                        values: {
                                            'custrecord_lh_cp_dt_category_ppto': '',
                                            'custrecord_lh_cp_dt_estado_busqueda': ANULADO,
                                            'custrecord_lh_cp_dt_factura_relacionada': '',
                                        }
                                    });
                                    log.debug('Proceso-Anulación', 'Transacción ' + context.newRecord.id + ' con detalle: ' + arrayCategorias[i][0] + ' anulado');
                                }
                            } else if (statusPPTo == PAGADO) {
                                const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [EJECUTADO, DISPONIBLE, PAGADO] });
                                filters.push(filterTwo);
                                param1 = parseFloat(arrayCategorias[i][1]);
                                param2 = monto;
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
                                        } else if (lhStatus == PAGADO) {
                                            statusPagado = result[i].getValue({ name: "internalId" });
                                            montoPagado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                                        }
                                    }
                                    let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusDisponible, isDynamic: true });
                                    let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                                    let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusPagado, isDynamic: true });

                                    montoDisponible = montoDisponible + param2;
                                    montoEjecutado = montoEjecutado - param1;
                                    montoPagado = montoPagado - (param2 - param1);

                                    openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                                    openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                                    openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoPagado });
                                    let saveRecord2 = openRecord2.save();
                                    let saveRecord3 = openRecord3.save();
                                    let saveRecord1 = openRecord1.save();
                                    log.debug('Records', saveRecord2 + ' - ' + saveRecord3 + ' - ' + saveRecord1);

                                    //!USER EVENT
                                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
                                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord1);

                                    record.submitFields({
                                        type: DETALLE_TRANSACCION_RECORD,
                                        id: arrayCategorias[i][0],
                                        values: {
                                            'custrecord_lh_cp_dt_category_ppto': '',
                                            'custrecord_lh_cp_dt_estado_busqueda': ANULADO,
                                            'custrecord_lh_cp_dt_factura_relacionada': '',
                                        }
                                    });
                                    log.debug('Proceso-Anulación', 'Transacción ' + context.newRecord.id + ' con detalle: ' + arrayCategorias[i][0] + ' anulado');
                                }
                            }
                        }
                        log.debug('FIN', 'FIN EXPENSE_REPORT VOID ====================================');
                    } catch (error) {
                        log.error('Error-IG-Anulado', error);
                        log.debug('ERROR', 'FIN EXPENSE_REPORT VOID ====================================');
                    }
                }
            }

            if (objRecord.type == JOURNAL_ENTRY) {
                let isJEVoid = context.newRecord.getValue({ fieldId: 'void' });
                let sublistData = isJEVoid.split(/\u0002/);
                log.debug("beforeSubmit-void", isJEVoid);
                log.debug("beforeSubmit-sublistData", sublistData[0].split('\u0005')[0]);
                isJEVoid = sublistData[0].split('\u0005')[0];
                if (isJEVoid == 'Void') {
                    try {
                        log.debug('INICIO', 'INICIO JOURNAL_ENTRY VOID ====================================');
                        let objRecord = record.load({ type: record.Type.JOURNAL_ENTRY, id: context.newRecord.id, isDynamic: true });
                        let param2 = 0;
                        let statusEjecutado = '';
                        let statusDisponible = '';
                        let montoEjecutado = 0;
                        let montoDisponible = 0;

                        let statusPPTo = objRecord.getValue('custbody_lh_cp_estado_ppto_oc');
                        let date = objRecord.getValue('trandate');
                        let month = sysDate(date);
                        month = month.month;
                        let year = objRecord.getValue('custbody_lh_anio_id_flag');
                        let temporalidad = objRecord.getValue('custbody_lh_temporalidad_flag');
                        let arrayCategorias = JSON.parse(objRecord.getValue('custbody_lh_categories_id_flag'));
                        if (arrayCategorias.length > 0) {
                            for (let i in arrayCategorias) {
                                let objRec = record.load({ type: DETALLE_TRANSACCION_RECORD, id: arrayCategorias[i][0], isDynamic: true });
                                let category = objRec.getValue('custrecord_lh_cp_dt_category_ppto');
                                let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
                                let filters = objSearch.filters;
                                const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
                                filters.push(filterOne);
                                const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
                                filters.push(filterThree);
                                if (statusPPTo == EJECUTADO) {
                                    const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [DISPONIBLE, EJECUTADO] });
                                    filters.push(filterTwo);
                                    param2 = parseFloat(arrayCategorias[i][1]);
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
                                        let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });

                                        montoDisponible = montoDisponible + param2;
                                        montoEjecutado = montoEjecutado - param2;

                                        openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                                        openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                                        let saveRecord2 = openRecord2.save();
                                        let saveRecord1 = openRecord1.save();
                                        log.debug('Records', saveRecord2 + ' - ' + saveRecord1);

                                        //!USER EVENT
                                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord1);

                                        record.submitFields({
                                            type: DETALLE_TRANSACCION_RECORD,
                                            id: arrayCategorias[i][0],
                                            values: {
                                                'custrecord_lh_cp_dt_category_ppto': '',
                                                'custrecord_lh_cp_dt_estado_busqueda': ANULADO,
                                                'custrecord_lh_cp_dt_pago_relacionado': '',
                                            }
                                        });
                                        log.debug('Proceso-Anulación', 'Transacción ' + context.newRecord.id + ' con detalle: ' + arrayCategorias[i][0] + ' anulado');
                                    }
                                }
                            }
                        }

                        log.debug('FIN', 'FIN JOURNAL_ENTRY VOID ====================================');
                    } catch (error) {
                        log.error('Error-JE-Anulado', error);
                        log.debug('ERROR', 'FIN JOURNAL_ENTRY VOID ====================================');
                    }
                } else {
                    let updateFlag = context.newRecord.getValue({ fieldId: 'custbody_lh_update_flag' });
                    if (updateFlag == 1) {
                        log.debug('INICIO', 'INICIO JOURNAL_ENTRY EDIT BEFORE ====================================');
                        log.debug('Delete', 'Entré a eliminar por edición');
                        let year = objRecord.getValue({ fieldId: 'custbody_lh_anio_id_flag' });
                        let date = objRecord.getValue({ fieldId: 'trandate' });
                        date = sysDate(date); //! sysDate (FUNCTION)
                        let month = date.month;
                        let thisArrayCategorias = JSON.parse(objRecord.getValue({ fieldId: 'custbody_lh_categories_id_flag' }));
                        for (let i in thisArrayCategorias) {
                            lookupFields = search.lookupFields({
                                type: DETALLE_TRANSACCION_RECORD,
                                id: thisArrayCategorias[i][0],
                                columns: ['custrecord_lh_cp_dt_category_ppto']
                            });
                            let category = lookupFields.custrecord_lh_cp_dt_category_ppto[0].value;
                            let exeReverse = executeReverseComprometido(category, year, month, thisArrayCategorias[i][1], JOURNAL_ENTRY);
                            if (exeReverse == 1) {
                                let featureRecord = record.delete({ type: DETALLE_TRANSACCION_RECORD, id: thisArrayCategorias[i][0] });
                                log.debug('Delete', 'Detalle: ' + featureRecord + ' delete');
                            }
                        }
                        log.debug('FIN', 'FIN JOURNAL_ENTRY EDIT BEFORE ====================================');
                    }
                }
            }

            if (objRecord.type == VENDOR_PAYMENT) {
                let isJEVoid = context.newRecord.getValue({ fieldId: 'void' });
                log.debug("beforeSubmit-void", isJEVoid);
                //!Falta terminar el desarrollo de pago a prod
                // if (isJEVoid) {
                //     try {
                //         log.debug('INICIO', 'INICIO VENDOR_PAYMENT VOID ====================================');
                //         let param1 = 0;
                //         let param2 = 0;
                //         let statusEjecutado = '';
                //         let statusPagado = '';
                //         let montoEjecutado = 0;
                //         let montoPagado = 0;
                //         let statusDet = '';
                //         let arrayMulti = new Array();
                //         let pagadoFlag = 0;
                //         let ordenrelacionada = '';

                //         let objSearch = search.load({ id: BP_PAYMENT_LINES_VOID_SEARCH });
                //         let filters = objSearch.filters;
                //         let filterOne = search.createFilter({ name: 'internalId', operator: search.Operator.ANYOF, values: context.newRecord.id });
                //         filters.push(filterOne);
                //         let result = objSearch.run().getRange({ start: 0, end: 50 });
                //         log.debug('Result', result);
                //         for (let k in result) {
                //             let type = result[k].getValue({ name: "type", join: "appliedToTransaction", summary: "GROUP" });
                //             let transactionid = result[k].getValue({ name: "appliedtotransaction", summary: "GROUP" });
                //             //let statusPPTo = result[k].getValue({ name: "custbody_lh_cp_estado_ppto_oc", join: "appliedToTransaction", summary: "GROUP" });
                //             let date = result[k].getValue({ name: "trandate", join: "appliedToTransaction", summary: "GROUP" });
                //             let month = getMonth(date);
                //             let year = result[k].getValue({ name: "custbody_lh_anio_id_flag", join: "appliedToTransaction", summary: "GROUP" });
                //             let temporalidad = result[k].getValue({ name: "custbody_lh_temporalidad_flag", join: "appliedToTransaction", summary: "GROUP" });
                //             //let createdFrom = result[k].getValue({ name: "custbody_lh_create_from_flag", join: "appliedToTransaction", summary: "GROUP" });
                //             let lookupFields = search.lookupFields({ type: search.Type.TRANSACTION, id: transactionid, columns: ['custbody_lh_categories_id_flag'] });
                //             let arrayCategorias = JSON.parse(lookupFields.custbody_lh_categories_id_flag);
                //             log.debug('arrayCategorias', arrayCategorias);

                //             for (let i in arrayCategorias) {
                //                 log.debug('Init-arrayCategorias', 'Detalle: ' + arrayCategorias[i][0] + ' - Monto: ' + arrayCategorias[i][1]);
                //                 let lookupFields2 = search.lookupFields({
                //                     type: DETALLE_TRANSACCION_RECORD,
                //                     id: arrayCategorias[i][0],
                //                     columns: [
                //                         'custrecord_lh_cp_dt_category_ppto',
                //                         'custrecord_lh_cp_dt_pagado',
                //                         'custrecord_lh_cp_dt_pago_relacionado',
                //                         'custrecord_lh_cp_dt_purchase_ord_related',
                //                         'custrecord_lh_cp_dt_ejecutado'
                //                     ]
                //                 });

                //                 param2 = parseFloat(arrayCategorias[i][1]);
                //                 let category = lookupFields2.custrecord_lh_cp_dt_category_ppto[0].value;
                //                 let pagado = parseFloat(lookupFields2.custrecord_lh_cp_dt_pagado);
                //                 let ejecutado = parseFloat(lookupFields2.custrecord_lh_cp_dt_ejecutado);
                //                 let pagorelacionado = lookupFields2.custrecord_lh_cp_dt_pago_relacionado;
                //                 ordenrelacionada = lookupFields2.custrecord_lh_cp_dt_purchase_ord_related[0].value;

                //                 pagado = pagado - param2;
                //                 log.debug('Cálculo', pagado + ' = ' + pagado + ' - ' + param2);

                //                 if (pagado > 0) {
                //                     statusDet = PAGADO;
                //                     if (type == EXPENSE_REPORT_TYPE) {
                //                         arrayMulti = '';
                //                     }
                //                 } else {
                //                     statusDet = EJECUTADO;
                //                     if (type == EXPENSE_REPORT_TYPE) {
                //                         arrayMulti = '';
                //                     }
                //                     pagadoFlag = 1;
                //                 }

                //                 if (type == VENDOR_BILL_TYPE) {
                //                     for (let j in pagorelacionado) {
                //                         if (pagorelacionado[j].value != context.newRecord.id) {
                //                             arrayMulti.push(pagorelacionado[j].value);
                //                         }
                //                     }
                //                 }
                //                 record.submitFields({
                //                     type: DETALLE_TRANSACCION_RECORD,
                //                     id: arrayCategorias[i][0],
                //                     values: {
                //                         'custrecord_lh_cp_dt_pagado': pagado,
                //                         'custrecord_lh_cp_dt_ejecutado': param2 + ejecutado,
                //                         'custrecord_lh_cp_dt_estado_busqueda': statusDet,
                //                         'custrecord_lh_cp_dt_pago_relacionado': arrayMulti,
                //                     }
                //                 });
                //                 log.debug('Proceso-Anulación', 'Transacción ' + context.newRecord.id + ' con detalle: ' + arrayCategorias[i][0] + ' pago anulado');

                //                 //TODO: Actualización de PPTO
                //                 let objSearch2 = search.load({ id: CATEGORIA_PPTO_PERIODOS });
                //                 let filters2 = objSearch2.filters;
                //                 let filterFour = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
                //                 filters2.push(filterFour);
                //                 let filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
                //                 filters2.push(filterThree);
                //                 let filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [EJECUTADO, PAGADO] });
                //                 filters2.push(filterTwo);
                //                 let result = objSearch2.run().getRange({ start: 0, end: 5 });

                //                 if (temporalidad == TEMPORALIDAD_MENSUAL || temporalidad == TEMPORALIDAD_TRIMESTRAL || temporalidad == TEMPORALIDAD_ANUAL) {
                //                     for (let i in result) {
                //                         let lhStatus = result[i].getValue({ name: "custrecord_lh_detalle_cppto_status" });
                //                         if (lhStatus == EJECUTADO) {
                //                             statusEjecutado = result[i].getValue({ name: "internalId" });
                //                             montoEjecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                //                         } else if (lhStatus == PAGADO) {
                //                             statusPagado = result[i].getValue({ name: "internalId" });
                //                             montoPagado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                //                         }
                //                     }
                //                     let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                //                     let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusPagado, isDynamic: true });

                //                     montoEjecutado = montoEjecutado + param2;
                //                     montoPagado = montoPagado - param2;

                //                     openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                //                     openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoPagado });
                //                     let saveRecord2 = openRecord2.save();
                //                     let saveRecord1 = openRecord1.save();
                //                     log.debug('Period-Records', saveRecord2 + ' - ' + saveRecord1);

                //                     //!USER EVENT
                //                     setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                //                     setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord1);
                //                 }
                //             }

                //             if (pagadoFlag == 0) {
                //                 if (type == VENDOR_BILL_TYPE) {
                //                     record.submitFields({
                //                         type: record.Type.VENDOR_BILL,
                //                         id: transactionid,
                //                         values: {
                //                             'custbody_lh_cp_estado_ppto_oc': EJECUTADO,
                //                             'custbody_lh_payment_status_flag': ''
                //                         }
                //                     });
                //                 } else {
                //                     record.submitFields({
                //                         type: record.Type.EXPENSE_REPORT,
                //                         id: transactionid,
                //                         values: {
                //                             'custbody_lh_payment_status_flag': ''
                //                         }
                //                     });
                //                 }
                //             } else {
                //                 if (type == VENDOR_BILL_TYPE) {
                //                     record.submitFields({
                //                         type: record.Type.VENDOR_BILL,
                //                         id: transactionid,
                //                         values: {
                //                             'custbody_lh_cp_estado_ppto_oc': EJECUTADO,
                //                             'custbody_lh_payment_status_flag': ''
                //                         }
                //                     });
                //                     if (ordenrelacionada.length != 0) {
                //                         record.submitFields({
                //                             type: record.Type.PURCHASE_ORDER,
                //                             id: ordenrelacionada,
                //                             values: {
                //                                 'custbody_lh_cp_estado_ppto_oc': EJECUTADO
                //                             }
                //                         });
                //                     }
                //                 } else {
                //                     record.submitFields({
                //                         type: record.Type.EXPENSE_REPORT,
                //                         id: transactionid,
                //                         values: {
                //                             'custbody_lh_cp_estado_ppto_oc': EJECUTADO,
                //                             'custbody_lh_payment_status_flag': ''
                //                         }
                //                     });
                //                 }
                //             }
                //         }
                //         log.debug('FIN', 'FIN VENDOR_PAYMENT VOID ====================================');
                //     } catch (error) {
                //         log.error('Error-VENDOR_PAYMENT-Anulado', error);
                //         log.debug('ERROR', 'FIN VENDOR_PAYMENT VOID ====================================');
                //     }
                // } 

                //!Revisar antes de descomentar
                // else {
                //     log.debug('INICIO', 'INICIO VENDOR_PAYMENT EDIT BEFORE ====================================');
                //     let arrayDeletePay = '';
                //     let arrayPayDetails = context.newRecord.getValue('custbody_lh_categories_id_flag');
                //     if (arrayPayDetails.length != 0) {
                //         arrayPayDetails = JSON.parse(arrayPayDetails);
                //         arrayDeletePay = deletePay(context.newRecord.id, arrayPayDetails);
                //     }

                //     if (arrayDeletePay.length != 0) {
                //         arrayDeletePay = JSON.stringify(arrayDeletePay);
                //     } else {
                //         arrayDeletePay = '';
                //     }
                //     context.newRecord.setValue('custbody_lh_categories_id_flag', arrayDeletePay);
                //     log.debug('FIN', 'FIN VENDOR_PAYMENT EDIT BEFORE ====================================');
                // }
            }

            if (objRecord.type == VENDOR_CREDIT) {
                let isJEVoid = context.newRecord.getValue({ fieldId: 'void' });
                log.debug("beforeSubmit-void-VENDOR_CREDIT", isJEVoid);
                if (isJEVoid) {
                    try {
                        log.debug('INICIO', 'INICIO VENDOR_CREDIT VOID ====================================');
                        let objRecord = record.load({ type: record.Type.VENDOR_CREDIT, id: context.newRecord.id, isDynamic: true });
                        let param2 = 0;
                        let statusEjecutado = '';
                        let statusDisponible = '';
                        let montoEjecutado = 0;
                        let montoDisponible = 0;
                        let arrayMulti = new Array();

                        // let statusPPTo = objRecord.getValue('custbody_lh_cp_estado_ppto_oc');
                        let billId = objRecord.getValue({ fieldId: 'createdfrom' });
                        let date = objRecord.getValue('trandate');
                        let month = sysDate(date);
                        month = month.month;
                        let year = objRecord.getValue('custbody_lh_anio_id_flag');
                        let temporalidad = objRecord.getValue('custbody_lh_temporalidad_flag');
                        let thisArrayCategorias = JSON.parse(objRecord.getValue({ fieldId: 'custbody_lh_categories_id_flag' }));
                        let arrayCategorias = JSON.parse(objRecord.getValue('custbody_lh_categories_id_edit_flag'));
                        for (let i in arrayCategorias) {
                            let objRec = record.load({ type: DETALLE_TRANSACCION_RECORD, id: arrayCategorias[i][0], isDynamic: true });
                            let category = objRec.getValue('custrecord_lh_cp_dt_category_ppto');
                            let ejecutado = parseFloat(objRec.getValue('custrecord_lh_cp_dt_ejecutado'));
                            let disponible = parseFloat(objRec.getValue('custrecord_lh_cp_dt_disponible'));
                            thisArrayCategorias.map((dato) => {
                                if (dato[0] == arrayCategorias[i][0]) {
                                    dato[1] = dato[1] + parseFloat(arrayCategorias[i][1]);
                                }
                                return dato;
                            });
                            let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
                            let filters = objSearch.filters;
                            const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
                            filters.push(filterOne);
                            const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
                            filters.push(filterThree);
                            const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [DISPONIBLE, EJECUTADO] });
                            filters.push(filterTwo);
                            param2 = parseFloat(arrayCategorias[i][1]);
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
                                let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });

                                montoDisponible = montoDisponible - param2;
                                montoEjecutado = montoEjecutado + param2;

                                openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                                openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                                let saveRecord2 = openRecord2.save();
                                let saveRecord1 = openRecord1.save();
                                log.debug('Records', saveRecord2 + ' - ' + saveRecord1);

                                //!USER EVENT
                                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord1);

                                record.submitFields({
                                    type: DETALLE_TRANSACCION_RECORD,
                                    id: arrayCategorias[i][0],
                                    values: {
                                        'custrecord_lh_cp_dt_ejecutado': ejecutado + param2,
                                        'custrecord_lh_cp_dt_disponible': disponible - param2
                                    }
                                });
                                // log.debug('Proceso-Anulación', 'Transacción ' + context.newRecord.id + ' con detalle: ' + arrayCategorias[i][0] + ' anulado');
                            }
                        }
                        record.submitFields({
                            type: record.Type.VENDOR_BILL,
                            id: billId,
                            values: {
                                'custbody_lh_categories_id_flag': JSON.stringify(thisArrayCategorias)
                            }
                        });

                        for (let i in arrayCategorias) {
                            let detalleId = arrayCategorias[i][0];
                            let lookupFields2 = search.lookupFields({ type: DETALLE_TRANSACCION_RECORD, id: detalleId, columns: ['custrecord_lh_cp_dt_factura_relacionada'] });
                            lookupFields2 = lookupFields2.custrecord_lh_cp_dt_factura_relacionada;
                            for (let j in lookupFields2) {
                                if (lookupFields2[j].value != context.newRecord.id) {
                                    arrayMulti.push(lookupFields2[j].value);
                                }
                            }
                            log.debug('arrayMulti', arrayMulti);
                            let detaR = record.submitFields({
                                type: DETALLE_TRANSACCION_RECORD,
                                id: detalleId,
                                values: {
                                    'custrecord_lh_cp_dt_factura_relacionada': arrayMulti,

                                }
                            });
                            log.debug('Detalle-Transaction', 'Detalle: ' + detaR + ' actualizado.');
                        }

                        // record.submitFields({
                        //     type: DETALLE_TRANSACCION_RECORD,
                        //     id: arrayCategoriasEdit[i][0],
                        //     values: {
                        //         'custrecord_lh_cp_dt_ejecutado': parseFloat(lookupFields.custrecord_lh_cp_dt_ejecutado) + parseFloat(arrayCategoriasEdit[i][1]),
                        //         'custrecord_lh_cp_dt_disponible': parseFloat(lookupFields.custrecord_lh_cp_dt_disponible) - parseFloat(arrayCategoriasEdit[i][1])
                        //     }
                        // });
                        log.debug('FIN', 'FIN VENDOR_CREDIT VOID ====================================');
                    } catch (error) {
                        log.error('Error-IG-Anulado', error);
                        log.debug('ERROR', 'FIN VENDOR_CREDIT VOID ====================================');
                    }
                } else {
                    let updateFlag = context.newRecord.getValue({ fieldId: 'custbody_lh_update_flag' });
                    if (updateFlag == 1) {
                        log.debug('INICIO', 'INICIO VENDOR_CREDIT EDIT BEFORE ====================================');
                        log.debug('Delete', 'Entré a eliminar por edición');
                        let year = objRecord.getValue({ fieldId: 'custbody_lh_anio_id_flag' });
                        let date = objRecord.getValue({ fieldId: 'trandate' });
                        let billId = objRecord.getValue({ fieldId: 'createdfrom' });
                        let arrayCategorias = JSON.parse(objRecord.getValue({ fieldId: 'custbody_lh_categories_id_flag' }));
                        let arrayCategoriasEdit = JSON.parse(objRecord.getValue({ fieldId: 'custbody_lh_categories_id_edit_flag' }));
                        date = sysDate(date); //! sysDate (FUNCTION)
                        let month = date.month;
                        for (let i in arrayCategoriasEdit) {
                            let lookupFields = search.lookupFields({
                                type: DETALLE_TRANSACCION_RECORD,
                                id: arrayCategoriasEdit[i][0],
                                columns: ['custrecord_lh_cp_dt_category_ppto', 'custrecord_lh_cp_dt_ejecutado', 'custrecord_lh_cp_dt_disponible']
                            });
                            let category = lookupFields.custrecord_lh_cp_dt_category_ppto[0].value;
                            let exeReverse = executeReverseComprometido(category, year, month, arrayCategoriasEdit[i][1], VENDOR_CREDIT);
                            if (exeReverse == 1) {
                                record.submitFields({
                                    type: DETALLE_TRANSACCION_RECORD,
                                    id: arrayCategoriasEdit[i][0],
                                    values: {
                                        'custrecord_lh_cp_dt_ejecutado': parseFloat(lookupFields.custrecord_lh_cp_dt_ejecutado) + parseFloat(arrayCategoriasEdit[i][1]),
                                        'custrecord_lh_cp_dt_disponible': parseFloat(lookupFields.custrecord_lh_cp_dt_disponible) - parseFloat(arrayCategoriasEdit[i][1])
                                    }
                                });
                            }
                            arrayCategorias.map((dato) => {
                                if (dato[0] == arrayCategoriasEdit[i][0]) {
                                    dato[1] = dato[1] + parseFloat(arrayCategoriasEdit[i][1]);
                                }
                                return dato;
                            });
                        }
                        objRecord.setValue('custbody_lh_categories_id_flag', JSON.stringify(arrayCategorias));
                        record.submitFields({
                            type: record.Type.VENDOR_BILL,
                            id: billId,
                            values: {
                                'custbody_lh_categories_id_flag': JSON.stringify(arrayCategorias)
                            }
                        });
                        log.debug('FIN', 'FIN VENDOR_CREDIT EDIT BEFORE ====================================');
                    }

                }
            }
        }
    }


    const afterSubmit = (context) => {
        const objRecord = context.newRecord;
        if (context.type === context.UserEventType.CREATE) {
            if (objRecord.type == VENDOR_BILL) {
                try {
                    let recordId = objRecord.id;
                    let arrayMulti = new Array();
                    let arrayDetalle = new Array();
                    let lookupFields = search.lookupFields({ type: search.Type.VENDOR_BILL, id: recordId, columns: ['custbody_lh_categories_id_flag', 'custbody_lh_create_from_flag'] });
                    let createdFrom = lookupFields.custbody_lh_create_from_flag
                    if (createdFrom.length == 0) {
                        log.debug('INICIO', 'INICIO VENDOR_BILL DIRECTO ====================================');
                        try {
                            let objSearch;
                            let join = '';
                            let tipoCambio = 1;
                            let objOC = search.lookupFields({
                                type: search.Type.VENDOR_BILL,
                                id: recordId,
                                columns: ['subsidiary', 'custbody_lh_temporalidad_flag', 'custbody_lh_sublist_type_flag', 'custbody_lh_nivel_control_flag', 'currency']
                            });
                            let subsidiary = objOC.subsidiary[0].value;
                            let temporalidad = objOC.custbody_lh_temporalidad_flag;
                            let nivelControl = objOC.custbody_lh_nivel_control_flag;
                            let subList = objOC.custbody_lh_sublist_type_flag;
                            let currency = objOC.currency[0].value;
                            if (temporalidad.length != 0 && subList.length != 0) {
                                if (subList == ITEM_SUBLIST) {
                                    objSearch = search.load({ id: PO_ITEM_LINES_SEARCH });
                                    join = 'item'
                                } else if (subList == EXPENSE_SUBLIST) {
                                    objSearch = search.load({ id: PO_EXPENSE_LINES_SEARCH });
                                    join = 'expenseCategory';
                                }
                                let filters = objSearch.filters;
                                const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: recordId });
                                filters.push(filterOne);
                                const filterTwo = search.createFilter({ name: 'subsidiary', join: join, operator: search.Operator.ANYOF, values: subsidiary });
                                filters.push(filterTwo);

                                //* =====> INIT RESULTS 
                                let results = objSearch.run().getRange({ start: 0, end: 200 });
                                log.debug('Res', results);
                                let date = results[0].getValue(objSearch.columns[6]);
                                let month = getMonth(date);
                                let year = results[0].getValue(objSearch.columns[7]);
                                let anio = date.split('/')[2];
                                if (year == '- None -') {
                                    year = getAnioId(anio); //! FUNCTION => getAnioId
                                }
                                let internalidPeriod = getPeriod(month, anio); //! FUNCTION => getPeriod
                                if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                                    tipoCambio = getTipoCambio(subsidiary, month, anio); //! FUNCTION => getTipoCambio
                                }
                                //let temporalidad = results[0].getValue(objSearch.columns[9]);
                                for (let i in results) {
                                    let deparment = results[i].getValue(objSearch.columns[2]);
                                    let subsidiary = results[i].getValue(objSearch.columns[3]);
                                    let account = results[i].getValue(objSearch.columns[4]);

                                    //log.debug('Cuenta', account);
                                    let category = results[i].getValue(objSearch.columns[5]);
                                    let amount = parseFloat(results[i].getValue(objSearch.columns[9]));
                                    amount = amount / tipoCambio;

                                    let response = getPresupuesto(category, year, month, temporalidad, recordId, deparment, subsidiary, account, amount, nivelControl, TRANSACTION_VENDOR_BILL, internalidPeriod, tipoCambio); //! FUNCTION => getPresupuesto
                                    log.debug('Detalle-Transacción', response);
                                    arrayDetalle.push([response.toString(), amount]);
                                }
                                record.submitFields({
                                    type: record.Type.VENDOR_BILL,
                                    id: recordId,
                                    values: {
                                        'custbody_lh_categories_id_flag': JSON.stringify(arrayDetalle)
                                    }
                                });
                                let scriptObj = runtime.getCurrentScript();
                                log.debug('Remaining governance', 'units => ' + scriptObj.getRemainingUsage());
                            } else {
                                log.debug('Configuración', 'No se generó la temporalidad o sublista')
                            }
                        } catch (error) {
                            log.error('Error-afterSubmit', error);
                            log.debug('ERROR', 'FIN VENDOR_BILL DIRECTO =======================================')
                        }
                        log.debug('FIN', 'FIN VENDOR_BILL DIRECTO =======================================');
                    } else {
                        log.debug('INICIO', 'INICIO VENDOR_BILL ====================================');
                        log.debug('BILLID', recordId);
                        //====================================================================================================
                        let vienedeOC = context.newRecord.getValue('custbody_lh_create_from_flag');
                        log.debug('vienedeOC-Length-beforeSubmit', vienedeOC + ' - ' + vienedeOC.length);
                        //====================================================================================================
                        let objRecord = record.load({ type: record.Type.VENDOR_BILL, id: recordId, isDynamic: true });
                        let json = new Array();
                        let arrayDetalle = new Array();
                        let subList = '';
                        let tipoCambio = 1;
                        let actionFlag = '';

                        let temporalidad = objRecord.getValue({ fieldId: 'custbody_lh_temporalidad_flag' });
                        if (temporalidad != 0) {
                            let purchaseOrder = objRecord.getValue({ fieldId: 'custbody_lh_create_from_flag' });
                            let currency = objRecord.getValue('currency');
                            subList = objRecord.getValue({ fieldId: 'custbody_lh_sublist_type_flag' });
                            let subsidiary = objRecord.getValue({ fieldId: 'subsidiary' });
                            let date = objRecord.getValue({ fieldId: 'trandate' });
                            date = sysDate(date); //! sysDate (FUNCTION)
                            if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                                tipoCambio = getTipoCambio(subsidiary, date.month, date.year); //! getTipoCambio (FUNCTION)
                            }
                            let numLines = objRecord.getLineCount({ sublistId: subList });
                            for (let i = 0; i < numLines; i++) {
                                let amount = objRecord.getSublistValue({ sublistId: subList, fieldId: 'amount', line: i });
                                let category = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcol_lh_ppto_flag', line: i });
                                json.push({
                                    category: category,
                                    amount: amount
                                });
                            }
                            let categorias = json.map((x) => x.category);
                            let arrayCategorias = [...new Set(categorias)];
                            let arrayMontos = [];
                            arrayCategorias.forEach((cat) => {
                                let filtro = json.filter((x) => x.category == cat);
                                let montos = filtro.reduce((acc, valor) => acc + valor.amount, 0);
                                arrayMontos.push(montos);
                            });
                            log.debug('arrayCategorias', arrayCategorias);
                            log.debug('arrayMontos', arrayMontos);
                            for (let j in arrayCategorias) {
                                let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                                let filters = objSearch.filters;
                                const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: purchaseOrder });
                                filters.push(filterOne);
                                const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_dt_category_ppto', operator: search.Operator.ANYOF, values: arrayCategorias[j] });
                                filters.push(filterTwo);
                                let result = objSearch.run().getRange({ start: 0, end: 5 });
                                for (let i in result) {
                                    let monto = parseFloat(arrayMontos[j]) / tipoCambio;
                                    let internalId = result[i].getValue({ name: "internalId" });
                                    let estado = result[i].getValue({ name: "custrecord_lh_cp_dt_estado_busqueda" });
                                    let comprometido = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_comprometido" }));
                                    let ejecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_ejecutado" })); //TODO Por si hay ejecutado parcial sume y no setee
                                    if (comprometido < monto) {
                                        comprometido = monto - comprometido;
                                    } else {
                                        comprometido = comprometido - monto;
                                    }
                                    arrayDetalle.push([internalId, monto]);

                                    if (estado == PAGADO) {
                                        actionFlag = PAGADO;
                                    } else {
                                        actionFlag = EJECUTADO;
                                    }
                                    record.submitFields({
                                        type: DETALLE_TRANSACCION_RECORD,
                                        id: internalId,
                                        values: {
                                            'custrecord_lh_cp_dt_ejecutado': monto + ejecutado,
                                            'custrecord_lh_cp_dt_comprometido': comprometido,
                                            'custrecord_lh_cp_dt_estado_busqueda': actionFlag,
                                            'custrecord_lh_cp_dt_accion_ppto': actionFlag
                                        }
                                    });
                                    pptoEjecutado(internalId, monto);
                                }
                            }

                            record.submitFields({
                                type: record.Type.VENDOR_BILL,
                                id: recordId,
                                values: {
                                    'custbody_lh_cp_estado_ppto_oc': EJECUTADO,
                                    'custbody_lh_categories_id_flag': JSON.stringify(arrayDetalle)
                                }
                            });

                            record.submitFields({
                                type: record.Type.PURCHASE_ORDER,
                                id: purchaseOrder,
                                values: {
                                    'custbody_lh_cp_estado_ppto_oc': actionFlag,
                                }
                            });
                            //! [["395",1000],["394",1000]]
                            for (let i in arrayDetalle) {
                                let detalleId = parseInt(arrayDetalle[i][0]);
                                log.debug('InternalID-Flag', detalleId);
                                try {
                                    let lookupFields2 = search.lookupFields({ type: DETALLE_TRANSACCION_RECORD, id: detalleId, columns: ['custrecord_lh_cp_dt_factura_relacionada'] });
                                    lookupFields2 = lookupFields2.custrecord_lh_cp_dt_factura_relacionada;
                                    if (lookupFields2.length > 0) {
                                        for (let j in lookupFields2) {
                                            arrayMulti.push(lookupFields2[j].value);
                                        }
                                        arrayMulti.push(recordId);
                                    } else {
                                        arrayMulti.push(recordId);
                                    }
                                } catch (error) {
                                    log.error('Error-Convert-arrayDetalle', error);
                                }
                                log.debug('arrayMulti', arrayMulti);
                                let detaR = record.submitFields({
                                    type: DETALLE_TRANSACCION_RECORD,
                                    id: detalleId,
                                    values: {
                                        'custrecord_lh_cp_dt_factura_relacionada': arrayMulti,
                                    }
                                });
                                log.debug('Detalle-Transaction', 'Detalle: ' + detaR + ' actualizado.');
                            }
                        }
                    }
                    log.debug('FIN', 'FIN VENDOR_BILL =======================================');
                } catch (error) {
                    log.error('Error-Vendor-Bill', error);
                }
            }

            if (objRecord.type == PURCHASE_ORDER) {
                log.debug('INICIO', 'INICIO PURCHASE_ORDER ====================================');
                try {
                    let recordId = objRecord.id;
                    record.submitFields({ type: record.Type.PURCHASE_ORDER, id: recordId, values: { 'custbody_lh_create_from_flag': recordId } });
                    // const type = context.type;
                    let objOC = search.lookupFields({
                        type: search.Type.PURCHASE_ORDER,
                        id: recordId,
                        columns: [
                            'subsidiary',
                            'custbody_lh_temporalidad_flag',
                            'custbody_lh_sublist_type_flag',
                            'custbody_lh_nivel_control_flag',
                            'currency',
                            'custbody_lh_cp_estado_ppto_oc'
                        ]
                    });
                    log.debug('objOC', objOC);
                    let estadoPPTO = objOC.custbody_lh_cp_estado_ppto_oc[0].value;
                    if (estadoPPTO == RESERVADO) {
                        executeCreated(recordId, objOC);
                    } else {
                        log.debug('Saved-Create', 'No tiene el estado establecido para este evento.');
                    }
                } catch (error) {
                    log.error('Error-afterSubmit', error);
                    log.debug('ERROR', 'FIN PURCHASE_ORDER =======================================');
                }
                log.debug('FIN', 'FIN PURCHASE_ORDER =======================================');
            }

            if (objRecord.type == VENDOR_CREDIT) {
                log.debug('INICIO', 'INICIO VENDOR_CREDIT ====================================');
                let recordId = objRecord.id;
                let arrayMulti = new Array();
                let json = new Array();
                let json2 = new Array();
                let subList = '';
                let tipoCambio = 1;
                let fromOC = 1
                try {
                    let objRecord = record.load({ type: record.Type.VENDOR_CREDIT, id: recordId, isDynamic: true });
                    let temporalidad = objRecord.getValue({ fieldId: 'custbody_lh_temporalidad_flag' });
                    if (temporalidad.length != 0) {
                        let purchaseOrder = objRecord.getValue({ fieldId: 'custbody_lh_create_from_flag' });
                        let billId = objRecord.getValue({ fieldId: 'createdfrom' });
                        if (purchaseOrder.length == 0) {
                            purchaseOrder = objRecord.getValue({ fieldId: 'createdfrom' });
                            fromOC = 0;
                        }
                        let arrayDetalle = JSON.parse(objRecord.getValue('custbody_lh_categories_id_flag'));
                        let currency = objRecord.getValue('currency');
                        let subsidiary = objRecord.getValue({ fieldId: 'subsidiary' });
                        let date = objRecord.getValue({ fieldId: 'trandate' });
                        date = sysDate(date); //! sysDate (FUNCTION)
                        if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                            tipoCambio = getTipoCambio(subsidiary, date.month, date.year); //! getTipoCambio (FUNCTION)
                        }
                        subList = objRecord.getValue({ fieldId: 'custbody_lh_sublist_type_flag' });
                        let numLines = objRecord.getLineCount({ sublistId: subList });
                        for (let i = 0; i < numLines; i++) {
                            let amount = objRecord.getSublistValue({ sublistId: subList, fieldId: 'amount', line: i });
                            let category = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcol_lh_ppto_flag', line: i });
                            json.push({
                                category: category,
                                amount: amount
                            });
                        }
                        let categorias = json.map((x) => x.category);
                        let arrayCategorias = [...new Set(categorias)];
                        let arrayMontos = [];
                        arrayCategorias.forEach((cat) => {
                            let filtro = json.filter((x) => x.category == cat);
                            let montos = filtro.reduce((acc, valor) => acc + valor.amount, 0);
                            arrayMontos.push(montos);
                        });
                        log.debug('arrayCategorias', arrayCategorias);
                        log.debug('arrayMontos', arrayMontos);
                        for (let j in arrayCategorias) {
                            let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                            let filters = objSearch.filters;
                            if (fromOC == 1) {
                                const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: purchaseOrder });
                                filters.push(filterOne);
                            } else {
                                const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_factura_relacionada', operator: search.Operator.ANYOF, values: purchaseOrder });
                                filters.push(filterOne);
                            }
                            const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_dt_category_ppto', operator: search.Operator.ANYOF, values: arrayCategorias[j] });
                            filters.push(filterTwo);
                            let result = objSearch.run().getRange({ start: 0, end: 5 });
                            log.debug('Res', result);
                            for (let i in result) {
                                let monto = parseFloat(arrayMontos[j]) / tipoCambio;
                                let internalId = result[i].getValue({ name: "internalId" });
                                arrayDetalle.map((dato) => {
                                    if (dato[0] == internalId) {
                                        dato[1] = dato[1] - monto;
                                    }
                                    return dato;
                                });

                                let ejecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_ejecutado" }));
                                let disponible = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_disponible" }));//TODO Por si hay ejecutaod parcial sume y no setee
                                if (ejecutado < monto) {
                                    ejecutado = monto - ejecutado;
                                } else {
                                    ejecutado = ejecutado - monto;
                                }
                                record.submitFields({
                                    type: DETALLE_TRANSACCION_RECORD,
                                    id: internalId,
                                    values: {
                                        'custrecord_lh_cp_dt_disponible': monto + disponible,
                                        'custrecord_lh_cp_dt_ejecutado': ejecutado,
                                        'custrecord_lh_cp_dt_accion_ppto': TRANSFERIDO
                                    }
                                });
                                pptoLiberadoAplicado(internalId, monto);
                                json2.push([internalId.toString(), monto]);
                            }
                        }
                        log.debug('newArrayDetalle', arrayDetalle);

                        record.submitFields({
                            type: record.Type.VENDOR_CREDIT,
                            id: recordId,
                            values: {
                                'custbody_lh_categories_id_flag': JSON.stringify(arrayDetalle),
                                'custbody_lh_categories_id_edit_flag': JSON.stringify(json2),
                                'custbody_lh_update_flag': ''
                            }
                        });

                        record.submitFields({
                            type: record.Type.VENDOR_BILL,
                            id: billId,
                            values: {
                                'custbody_lh_categories_id_flag': JSON.stringify(arrayDetalle)
                            }
                        });

                        for (let i in arrayDetalle) {
                            let detalleId = parseInt(arrayDetalle[i][0]);
                            log.debug('InternalID-Flag', detalleId);
                            try {
                                let lookupFields2 = search.lookupFields({ type: DETALLE_TRANSACCION_RECORD, id: detalleId, columns: ['custrecord_lh_cp_dt_factura_relacionada'] });
                                lookupFields2 = lookupFields2.custrecord_lh_cp_dt_factura_relacionada;
                                // if (lookupFields2.length > 0) {
                                for (let j in lookupFields2) {
                                    arrayMulti.push(lookupFields2[j].value);
                                }
                                arrayMulti.push(recordId);
                                // } else {
                                //     arrayMulti.push(recordId);
                                // }
                            } catch (error) {
                                log.error('Error-Convert-arrayDetalle', error);
                            }
                            log.debug('arrayMulti', arrayMulti);
                            let detaR = record.submitFields({
                                type: DETALLE_TRANSACCION_RECORD,
                                id: detalleId,
                                values: {
                                    'custrecord_lh_cp_dt_factura_relacionada': arrayMulti,
                                }
                            });
                            log.debug('Detalle-Transaction', 'Detalle: ' + detaR + ' actualizado.');
                        }
                    }
                    let scriptObj = runtime.getCurrentScript();
                    log.debug('Remaining governance', 'units => ' + scriptObj.getRemainingUsage());
                } catch (error) {
                    log.error('Error-afterSubmit', error);
                    log.debug('ERROR', 'FIN VENDOR_CREDIT =======================================')
                }
                log.debug('FIN', 'FIN VENDOR_CREDIT =======================================');
            }

            if (objRecord.type == VENDOR_PAYMENT) {
                log.debug('INICIO', 'INICIO VENDOR_PAYMENT ====================================');
                log.debug('Debug', context.newRecord.id);
                try {
                    procesoPago(context.newRecord.id);
                } catch (error) {
                    log.debug('ERROR', 'FIN VENDOR_PAYMENT ====================================');
                    log.error('Error-Post', error);
                }
                log.debug('FIN', 'FIN VENDOR_PAYMENT ====================================');
            }

            if (objRecord.type == EXPENSE_REPORT) {
                try {
                    log.debug('INICIO', 'INICIO EXPENSE_REPORT ====================================');
                    let recordId = objRecord.id;
                    record.submitFields({ type: record.Type.EXPENSE_REPORT, id: recordId, values: { 'custbody_lh_create_from_flag': recordId } });
                    let objOC = record.load({ type: record.Type.EXPENSE_REPORT, id: recordId, isDynamic: true });
                    let estadoPPTO = objOC.getValue('custbody_lh_cp_estado_ppto_oc');
                    if (estadoPPTO == RESERVADO) {
                        executeCreatedIG(recordId, objOC);
                    } else {
                        log.debug('Saved-Create', 'No tiene el estado establecido para este evento.');
                    }
                    log.debug('FIN', 'FIN EXPENSE_REPORT =======================================');
                } catch (error) {
                    log.error('Error-Expense-Report', error);
                }
            }

            if (objRecord.type == JOURNAL_ENTRY) {
                log.debug('INICIO', 'INICIO JOURNAL_ENTRY ====================================');
                try {
                    let recordId = objRecord.id;
                    record.submitFields({ type: record.Type.JOURNAL_ENTRY, id: recordId, values: { 'custbody_lh_create_from_flag': recordId } });
                    // const type = context.type;
                    let objOC = search.lookupFields({
                        type: search.Type.JOURNAL_ENTRY,
                        id: recordId,
                        columns: [
                            'subsidiary',
                            'custbody_lh_temporalidad_flag',
                            'custbody_lh_sublist_type_flag',
                            'custbody_lh_nivel_control_flag',
                            'currency',
                            'custbody_lh_cp_estado_ppto_oc',
                            'custbody_lh_categories_id_flag',
                            'custbody_lh_categories_id_edit_flag',
                            'custbody_lh_update_flag'
                        ]
                    });
                    let estadoPPTO = objOC.custbody_lh_cp_estado_ppto_oc[0].value;
                    if (estadoPPTO == EJECUTADO) {
                        executeCreated(recordId, objOC);
                    } else {
                        log.debug('Saved-Create', 'No tiene el estado establecido para este evento.');
                    }
                } catch (error) {
                    log.error('Error-afterSubmit', error);
                    log.debug('ERROR', 'FIN JOURNAL_ENTRY =======================================');
                }
                log.debug('FIN', 'FIN JOURNAL_ENTRY =======================================');
            }
        }


        if (context.type === context.UserEventType.EDIT) {
            if (objRecord.type == VENDOR_BILL) {
                try {
                    let isJEVoid = context.newRecord.getValue({ fieldId: 'void' });
                    if (isJEVoid) {
                        log.debug('INICIO', 'INICIO VENDOR_BILL VOID DIRECTO ====================================');
                        log.debug("afterSubmit-void", isJEVoid);
                        let objRecord = record.load({ type: record.Type.VENDOR_BILL, id: context.newRecord.id, isDynamic: true });
                        let vienedeOC = objRecord.getValue('custbody_lh_create_from_flag');
                        //log.debug('vienedeOC-Length-afterSubmit', vienedeOC + ' - ' + vienedeOC.length);
                        if (vienedeOC.length == 0) {
                            log.debug('Void', 'Entré a void en afterSubmit porque es Ejecución directa');
                            const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                            mrTask.scriptId = 'customscript_ts_ss_control_cp_void';
                            mrTask.deploymentId = 'customdeploy_ts_ss_control_cp_void';
                            mrTask.params = {
                                'custscript_cp_void_invoice_recordid': context.newRecord.id,
                            }
                            let taskToken = mrTask.submit();
                            log.debug('Token-ANULADO', taskToken);
                        }
                        log.debug('FIN', 'FIN VENDOR_BILL VOID DIRECTO =======================================');
                    } else {
                        let recordId = objRecord.id;
                        let arrayMulti = new Array();
                        let arrayDetalle = new Array();
                        let lookupFields = search.lookupFields({ type: search.Type.VENDOR_BILL, id: recordId, columns: ['custbody_lh_categories_id_flag', 'custbody_lh_create_from_flag', 'custbody_lh_update_flag'] });
                        let createdFrom = lookupFields.custbody_lh_create_from_flag;
                        let updateFlag = lookupFields.custbody_lh_update_flag;
                        if (updateFlag == 1) {
                            if (createdFrom.length == 0) {
                                log.debug('INICIO', 'INICIO VENDOR_BILL DIRECTO ====================================');
                                try {
                                    let objSearch;
                                    let join = '';
                                    let tipoCambio = 1;
                                    let objOC = search.lookupFields({
                                        type: search.Type.VENDOR_BILL,
                                        id: recordId,
                                        columns: ['subsidiary', 'custbody_lh_temporalidad_flag', 'custbody_lh_sublist_type_flag', 'custbody_lh_nivel_control_flag', 'currency']
                                    });
                                    let subsidiary = objOC.subsidiary[0].value;
                                    let temporalidad = objOC.custbody_lh_temporalidad_flag;
                                    let nivelControl = objOC.custbody_lh_nivel_control_flag;
                                    let subList = objOC.custbody_lh_sublist_type_flag;
                                    let currency = objOC.currency[0].value;
                                    if (temporalidad.length != 0 && subList.length != 0) {
                                        if (subList == ITEM_SUBLIST) {
                                            objSearch = search.load({ id: PO_ITEM_LINES_SEARCH });
                                            join = 'item'
                                        } else if (subList == EXPENSE_SUBLIST) {
                                            objSearch = search.load({ id: PO_EXPENSE_LINES_SEARCH });
                                            join = 'expenseCategory';
                                        }
                                        let filters = objSearch.filters;
                                        const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: recordId });
                                        filters.push(filterOne);
                                        const filterTwo = search.createFilter({ name: 'subsidiary', join: join, operator: search.Operator.ANYOF, values: subsidiary });
                                        filters.push(filterTwo);

                                        //* =====> INIT RESULTS 
                                        let results = objSearch.run().getRange({ start: 0, end: 200 });
                                        log.debug('Res', results);
                                        let date = results[0].getValue(objSearch.columns[6]);
                                        let month = getMonth(date);
                                        let year = results[0].getValue(objSearch.columns[7]);
                                        let anio = date.split('/')[2];
                                        if (year == '- None -') {
                                            year = getAnioId(anio); //! FUNCTION => getAnioId
                                        }
                                        let internalidPeriod = getPeriod(month, anio); //! FUNCTION => getPeriod
                                        if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                                            tipoCambio = getTipoCambio(subsidiary, month, anio); //! FUNCTION => getTipoCambio
                                        }
                                        //let temporalidad = results[0].getValue(objSearch.columns[9]);
                                        for (let i in results) {
                                            let deparment = results[i].getValue(objSearch.columns[2]);
                                            let subsidiary = results[i].getValue(objSearch.columns[3]);
                                            let account = results[i].getValue(objSearch.columns[4]);

                                            //log.debug('Cuenta', account);
                                            let category = results[i].getValue(objSearch.columns[5]);
                                            let amount = parseFloat(results[i].getValue(objSearch.columns[9]));
                                            amount = amount / tipoCambio;

                                            let response = getPresupuesto(category, year, month, temporalidad, recordId, deparment, subsidiary, account, amount, nivelControl, TRANSACTION_VENDOR_BILL, internalidPeriod, tipoCambio); //! FUNCTION => getPresupuesto
                                            log.debug('Detalle-Transacción', response);
                                            arrayDetalle.push([response.toString(), amount]);
                                        }
                                        log.debug('arrayDetalle', arrayDetalle);
                                        record.submitFields({
                                            type: record.Type.VENDOR_BILL,
                                            id: recordId,
                                            values: {
                                                'custbody_lh_update_flag': '',
                                                'custbody_lh_categories_id_flag': JSON.stringify(arrayDetalle)
                                            }
                                        });
                                        let scriptObj = runtime.getCurrentScript();
                                        log.debug('Remaining governance', 'units => ' + scriptObj.getRemainingUsage());
                                    } else {
                                        log.debug('Configuración', 'No se generó la temporalidad o sublista')
                                    }
                                } catch (error) {
                                    log.error('Error-afterSubmit', error);
                                    log.debug('ERROR', 'FIN VENDOR_BILL DIRECTO =======================================')
                                }
                                log.debug('FIN', 'FIN VENDOR_BILL DIRECTO =======================================');
                            } else {
                                log.debug('INICIO', 'INICIO VENDOR_BILL ====================================');
                                log.debug('BILLID', recordId);
                                //====================================================================================================
                                let vienedeOC = context.newRecord.getValue('custbody_lh_create_from_flag');
                                log.debug('vienedeOC-Length-beforeSubmit', vienedeOC + ' - ' + vienedeOC.length);
                                //====================================================================================================
                                let objRecord = record.load({ type: record.Type.VENDOR_BILL, id: recordId, isDynamic: true });
                                let json = new Array();
                                let arrayDetalle = new Array();
                                let subList = '';
                                let tipoCambio = 1;
                                let actionFlag = '';

                                let temporalidad = objRecord.getValue({ fieldId: 'custbody_lh_temporalidad_flag' });
                                if (temporalidad != 0) {
                                    let purchaseOrder = objRecord.getValue({ fieldId: 'custbody_lh_create_from_flag' });
                                    let currency = objRecord.getValue('currency');
                                    subList = objRecord.getValue({ fieldId: 'custbody_lh_sublist_type_flag' });
                                    let subsidiary = objRecord.getValue({ fieldId: 'subsidiary' });
                                    let date = objRecord.getValue({ fieldId: 'trandate' });
                                    date = sysDate(date); //! sysDate (FUNCTION)
                                    if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                                        tipoCambio = getTipoCambio(subsidiary, date.month, date.year); //! getTipoCambio (FUNCTION)
                                    }
                                    let numLines = objRecord.getLineCount({ sublistId: subList });
                                    for (let i = 0; i < numLines; i++) {
                                        let amount = objRecord.getSublistValue({ sublistId: subList, fieldId: 'amount', line: i });
                                        let category = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcol_lh_ppto_flag', line: i });
                                        json.push({
                                            category: category,
                                            amount: amount
                                        });
                                    }
                                    let categorias = json.map((x) => x.category);
                                    let arrayCategorias = [...new Set(categorias)];
                                    let arrayMontos = [];
                                    arrayCategorias.forEach((cat) => {
                                        let filtro = json.filter((x) => x.category == cat);
                                        let montos = filtro.reduce((acc, valor) => acc + valor.amount, 0);
                                        arrayMontos.push(montos);
                                    });
                                    log.debug('arrayCategorias', arrayCategorias);
                                    log.debug('arrayMontos', arrayMontos);
                                    for (let j in arrayCategorias) {
                                        let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                                        let filters = objSearch.filters;
                                        const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: purchaseOrder });
                                        filters.push(filterOne);
                                        const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_dt_category_ppto', operator: search.Operator.ANYOF, values: arrayCategorias[j] });
                                        filters.push(filterTwo);
                                        let result = objSearch.run().getRange({ start: 0, end: 5 });
                                        for (let i in result) {
                                            let monto = parseFloat(arrayMontos[j]) / tipoCambio;
                                            let internalId = result[i].getValue({ name: "internalId" });
                                            let estado = result[i].getValue({ name: "custrecord_lh_cp_dt_estado_busqueda" });
                                            let comprometido = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_comprometido" }));
                                            let ejecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_ejecutado" })); //TODO Por si hay ejecutado parcial sume y no setee
                                            if (comprometido < monto) {
                                                comprometido = monto - comprometido;
                                            } else {
                                                comprometido = comprometido - monto;
                                            }
                                            arrayDetalle.push([internalId, monto]);

                                            if (estado == PAGADO) {
                                                actionFlag = PAGADO;
                                            } else {
                                                actionFlag = EJECUTADO;
                                            }
                                            record.submitFields({
                                                type: DETALLE_TRANSACCION_RECORD,
                                                id: internalId,
                                                values: {
                                                    'custrecord_lh_cp_dt_ejecutado': monto + ejecutado,
                                                    'custrecord_lh_cp_dt_comprometido': comprometido,
                                                    'custrecord_lh_cp_dt_estado_busqueda': actionFlag,
                                                    'custrecord_lh_cp_dt_accion_ppto': actionFlag
                                                }
                                            });
                                            pptoEjecutado(internalId, monto);
                                        }
                                    }

                                    record.submitFields({
                                        type: record.Type.VENDOR_BILL,
                                        id: recordId,
                                        values: {
                                            'custbody_lh_update_flag': '',
                                            'custbody_lh_cp_estado_ppto_oc': EJECUTADO,
                                            'custbody_lh_categories_id_flag': JSON.stringify(arrayDetalle)
                                        }
                                    });

                                    record.submitFields({
                                        type: record.Type.PURCHASE_ORDER,
                                        id: purchaseOrder,
                                        values: {
                                            'custbody_lh_cp_estado_ppto_oc': actionFlag,
                                        }
                                    });
                                    //! [["395",1000],["394",1000]]
                                    for (let i in arrayDetalle) {
                                        let detalleId = parseInt(arrayDetalle[i][0]);
                                        log.debug('InternalID-Flag', detalleId);
                                        try {
                                            let lookupFields2 = search.lookupFields({ type: DETALLE_TRANSACCION_RECORD, id: detalleId, columns: ['custrecord_lh_cp_dt_factura_relacionada'] });
                                            lookupFields2 = lookupFields2.custrecord_lh_cp_dt_factura_relacionada;
                                            if (lookupFields2.length > 0) {
                                                for (let j in lookupFields2) {
                                                    arrayMulti.push(lookupFields2[j].value);
                                                }
                                                arrayMulti.push(recordId);
                                            } else {
                                                arrayMulti.push(recordId);
                                            }
                                        } catch (error) {
                                            log.error('Error-Convert-arrayDetalle', error);
                                        }
                                        log.debug('arrayMulti', arrayMulti);
                                        let detaR = record.submitFields({
                                            type: DETALLE_TRANSACCION_RECORD,
                                            id: detalleId,
                                            values: {
                                                'custrecord_lh_cp_dt_factura_relacionada': arrayMulti,
                                            }
                                        });
                                        log.debug('Detalle-Transaction', 'Detalle: ' + detaR + ' actualizado.');
                                    }
                                }
                            }
                            log.debug('FIN', 'FIN VENDOR_BILL =======================================');
                        }
                    }
                } catch (error) {
                    log.debug('FIN', 'FIN VENDOR_BILL VOID ERROR DIRECTO =======================================');
                    log.error('Error-afterSubmit-Void', error);
                }

                //TODO Otra función para anulación de factura
                // var voided = rec.getValue({ fieldId: 'voided' });
                // log.debug("voided", voided);
                // if (voided) {
                //     log.debug('Detected', 'Detecté el evento vacío desde voided');
                // }
            }

            if (objRecord.type == PURCHASE_ORDER) {
                let isJEVoid = context.newRecord.getValue({ fieldId: 'void' });
                if (!isJEVoid) {
                    log.debug('INICIO', 'INICIO PURCHASE_ORDER EDIT ====================================');
                    try {
                        let recordId = objRecord.id;
                        record.submitFields({ type: search.Type.PURCHASE_ORDER, id: recordId, values: { 'custbody_lh_create_from_flag': recordId } });

                        // const type = context.type;
                        let objOC = search.lookupFields({
                            type: search.Type.PURCHASE_ORDER,
                            id: recordId,
                            columns: [
                                'subsidiary',
                                'custbody_lh_temporalidad_flag',
                                'custbody_lh_sublist_type_flag',
                                'custbody_lh_nivel_control_flag',
                                'currency',
                                'custbody_lh_cp_estado_ppto_oc',
                                'custbody_lh_update_flag'
                            ]
                        });
                        let estadoPPTO = objOC.custbody_lh_cp_estado_ppto_oc[0].value;
                        let updateFlag = objOC.custbody_lh_update_flag;
                        if (estadoPPTO == RESERVADO && updateFlag == 1) {
                            log.debug('Input', 'Entré a crear por update y porque no es void');
                            executeCreated(recordId, objOC);
                        } else if (estadoPPTO == RESERVADO && updateFlag == 2) { //TODO Bloque para ingresar una oc al control presupuestal
                            log.debug('Saved-Edit', 'Orden de compra ' + recordId + ' ingresa al control presupuestal.');
                            executeCreated(recordId, objOC);
                        } else {
                            log.debug('Saved-Edit', 'Se guardó sin modificar');
                        }
                    } catch (error) {
                        log.error('Error-afterSubmit', error);
                        log.debug('ERROR', 'FIN PURCHASE_ORDER EDIT =======================================')
                    }
                    log.debug('FIN', 'FIN PURCHASE_ORDER EDIT =======================================');
                }
            }

            if (objRecord.type == VENDOR_PAYMENT) {
                let isJEVoid = context.newRecord.getValue({ fieldId: 'void' });
                if (!isJEVoid) {
                    log.debug('INICIO', 'INICIO VENDOR_PAYMENT ====================================');
                    log.debug('Debug', context.newRecord.id);
                    try {
                        procesoPago(context.newRecord.id);
                    } catch (error) {
                        log.debug('ERROR', 'FIN VENDOR_PAYMENT ====================================');
                        log.error('Error-Post', error);
                    }
                    log.debug('FIN', 'INICIO VENDOR_PAYMENT ====================================');
                }
            }

            if (objRecord.type == JOURNAL_ENTRY) {
                let isJEVoid = context.newRecord.getValue({ fieldId: 'void' });
                log.debug("afterSubmit-void", isJEVoid);
                if (isJEVoid == 'F') {
                    log.debug('INICIO', 'INICIO JOURNAL_ENTRY EDIT ====================================');
                    try {
                        let recordId = objRecord.id;
                        // record.submitFields({ type: record.Type.JOURNAL_ENTRY, id: recordId, values: { 'custbody_lh_create_from_flag': recordId } });
                        let objOC = search.lookupFields({
                            type: search.Type.JOURNAL_ENTRY,
                            id: recordId,
                            columns: [
                                'subsidiary',
                                'custbody_lh_temporalidad_flag',
                                'custbody_lh_sublist_type_flag',
                                'custbody_lh_nivel_control_flag',
                                'currency',
                                'custbody_lh_cp_estado_ppto_oc',
                                'custbody_lh_categories_id_flag',
                                'custbody_lh_categories_id_edit_flag',
                                'custbody_lh_update_flag'
                            ]
                        });
                        let estadoPPTO = objOC.custbody_lh_cp_estado_ppto_oc[0].value;
                        if (estadoPPTO == EJECUTADO) {
                            executeCreated(recordId, objOC);
                        } else {
                            log.debug('Saved-Create', 'No tiene el estado establecido para este evento.');
                        }
                        log.debug('FIN', 'FIN JOURNAL_ENTRY EDIT ====================================');
                    } catch (error) {
                        log.error('Error-afterSubmit', error);
                        log.debug('ERROR', 'FIN JOURNAL_ENTRY EDIT =======================================');
                    }
                }
            }

            if (objRecord.type == VENDOR_CREDIT) {
                let isJEVoid = context.newRecord.getValue({ fieldId: 'void' });
                if (!isJEVoid) {
                    log.debug('INICIO', 'INICIO VENDOR_CREDIT ====================================');
                    let recordId = objRecord.id;
                    let arrayMulti = new Array();
                    let json = new Array();
                    let json2 = new Array();
                    let subList = '';
                    let tipoCambio = 1;
                    let fromOC = 1
                    try {
                        let objRecord = record.load({ type: record.Type.VENDOR_CREDIT, id: recordId, isDynamic: true });
                        let temporalidad = objRecord.getValue({ fieldId: 'custbody_lh_temporalidad_flag' });
                        if (temporalidad.length != 0) {
                            let purchaseOrder = objRecord.getValue({ fieldId: 'custbody_lh_create_from_flag' });
                            let billId = objRecord.getValue({ fieldId: 'createdfrom' });
                            if (purchaseOrder.length == 0) {
                                purchaseOrder = objRecord.getValue({ fieldId: 'createdfrom' });
                                fromOC = 0;
                            }
                            let arrayDetalle = JSON.parse(objRecord.getValue('custbody_lh_categories_id_flag'));
                            let currency = objRecord.getValue('currency');
                            let subsidiary = objRecord.getValue({ fieldId: 'subsidiary' });
                            let date = objRecord.getValue({ fieldId: 'trandate' });
                            date = sysDate(date); //! sysDate (FUNCTION)
                            if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                                tipoCambio = getTipoCambio(subsidiary, date.month, date.year); //! getTipoCambio (FUNCTION)
                            }
                            subList = objRecord.getValue({ fieldId: 'custbody_lh_sublist_type_flag' });
                            let numLines = objRecord.getLineCount({ sublistId: subList });
                            for (let i = 0; i < numLines; i++) {
                                let amount = objRecord.getSublistValue({ sublistId: subList, fieldId: 'amount', line: i });
                                let category = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcol_lh_ppto_flag', line: i });
                                json.push({
                                    category: category,
                                    amount: amount
                                });
                            }
                            let categorias = json.map((x) => x.category);
                            let arrayCategorias = [...new Set(categorias)];
                            let arrayMontos = [];
                            arrayCategorias.forEach((cat) => {
                                let filtro = json.filter((x) => x.category == cat);
                                let montos = filtro.reduce((acc, valor) => acc + valor.amount, 0);
                                arrayMontos.push(montos);
                            });
                            log.debug('arrayCategorias', arrayCategorias);
                            log.debug('arrayMontos', arrayMontos);
                            for (let j in arrayCategorias) {
                                let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                                let filters = objSearch.filters;
                                if (fromOC == 1) {
                                    const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: purchaseOrder });
                                    filters.push(filterOne);
                                } else {
                                    const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_factura_relacionada', operator: search.Operator.ANYOF, values: purchaseOrder });
                                    filters.push(filterOne);
                                }
                                const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_dt_category_ppto', operator: search.Operator.ANYOF, values: arrayCategorias[j] });
                                filters.push(filterTwo);
                                let result = objSearch.run().getRange({ start: 0, end: 5 });
                                log.debug('Res', result);
                                for (let i in result) {
                                    let monto = parseFloat(arrayMontos[j]) / tipoCambio;
                                    let internalId = result[i].getValue({ name: "internalId" });
                                    arrayDetalle.map((dato) => {
                                        if (dato[0] == internalId) {
                                            dato[1] = dato[1] - monto;
                                        }
                                        return dato;
                                    });

                                    let ejecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_ejecutado" }));
                                    let disponible = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_disponible" }));//TODO Por si hay ejecutaod parcial sume y no setee
                                    if (ejecutado < monto) {
                                        ejecutado = monto - ejecutado;
                                    } else {
                                        ejecutado = ejecutado - monto;
                                    }
                                    record.submitFields({
                                        type: DETALLE_TRANSACCION_RECORD,
                                        id: internalId,
                                        values: {
                                            'custrecord_lh_cp_dt_disponible': monto + disponible,
                                            'custrecord_lh_cp_dt_ejecutado': ejecutado,
                                            'custrecord_lh_cp_dt_accion_ppto': TRANSFERIDO
                                        }
                                    });
                                    pptoLiberadoAplicado(internalId, monto);
                                    json2.push([internalId.toString(), monto]);
                                }
                            }
                            log.debug('newArrayDetalle', arrayDetalle);

                            record.submitFields({
                                type: record.Type.VENDOR_CREDIT,
                                id: recordId,
                                values: {
                                    'custbody_lh_categories_id_flag': JSON.stringify(arrayDetalle),
                                    'custbody_lh_categories_id_edit_flag': JSON.stringify(json2),
                                    'custbody_lh_update_flag': ''
                                }
                            });

                            record.submitFields({
                                type: record.Type.VENDOR_BILL,
                                id: billId,
                                values: {
                                    'custbody_lh_categories_id_flag': JSON.stringify(arrayDetalle)
                                }
                            });

                            // for (let i in arrayDetalle) {
                            //     let detalleId = parseInt(arrayDetalle[i][0]);
                            //     log.debug('InternalID-Flag', detalleId);
                            //     try {
                            //         let lookupFields2 = search.lookupFields({ type: DETALLE_TRANSACCION_RECORD, id: detalleId, columns: ['custrecord_lh_cp_dt_factura_relacionada'] });
                            //         lookupFields2 = lookupFields2.custrecord_lh_cp_dt_factura_relacionada;
                            //         // if (lookupFields2.length > 0) {
                            //         for (let j in lookupFields2) {
                            //             arrayMulti.push(lookupFields2[j].value);
                            //         }
                            //         arrayMulti.push(recordId);
                            //         // } else {
                            //         //     arrayMulti.push(recordId);
                            //         // }
                            //     } catch (error) {
                            //         log.error('Error-Convert-arrayDetalle', error);
                            //     }
                            //     log.debug('arrayMulti', arrayMulti);
                            //     let detaR = record.submitFields({
                            //         type: DETALLE_TRANSACCION_RECORD,
                            //         id: detalleId,
                            //         values: {
                            //             'custrecord_lh_cp_dt_factura_relacionada': arrayMulti,
                            //         }
                            //     });
                            //     log.debug('Detalle-Transaction', 'Detalle: ' + detaR + ' actualizado.');
                            // }
                        }
                        let scriptObj = runtime.getCurrentScript();
                        log.debug('Remaining governance', 'units => ' + scriptObj.getRemainingUsage());
                    } catch (error) {
                        log.error('Error-afterSubmit', error);
                        log.debug('ERROR', 'FIN VENDOR_CREDIT =======================================')
                    }
                    log.debug('FIN', 'FIN VENDOR_CREDIT =======================================');
                }
            }
        }
    }


    const pptoEjecutado = (recordId, monto) => {
        let action = '';
        let objPurchaseOrder = '';
        try {
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
            const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [COMPROMETIDO, EJECUTADO] });
            filters.push(filterTwo);

            //param2 = parseFloat(objRecord.getValue('custrecord_lh_cp_dt_ejecutado')); //!Revisar paramétro ya que en parcial concula con el total
            param2 = monto;
            let result = objSearch.run().getRange({ start: 0, end: 5 });
            if (temporalidad == TEMPORALIDAD_MENSUAL || temporalidad == TEMPORALIDAD_TRIMESTRAL || temporalidad == TEMPORALIDAD_ANUAL) {
                for (let i in result) {
                    let lhStatus = result[i].getValue({ name: "custrecord_lh_detalle_cppto_status" });
                    if (lhStatus == COMPROMETIDO) {
                        statusComprometido = result[i].getValue({ name: "internalId" });
                        montoComprometido = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                    } else if (lhStatus == EJECUTADO) {
                        statusEjecutado = result[i].getValue({ name: "internalId" });
                        montoEjecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                    }
                }
                let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusComprometido, isDynamic: true });
                let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });

                montoComprometido = montoComprometido - param2;
                montoEjecutado = montoEjecutado + param2;

                openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoComprometido });
                openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                let saveRecord2 = openRecord2.save();
                let saveRecord3 = openRecord3.save();
                log.debug('Records', saveRecord2 + ' - ' + saveRecord3);

                //!USER EVENT
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
            }
        } catch (error) {
            log.error('Error-pptoEjecutado', error);
        }
    }


    const pptoLiberadoAplicado = (recordId, monto) => {
        let action = '';
        let objPurchaseOrder = '';
        try {
            let param2 = 0;
            let statusEjecutado = '';
            let statusDisponible = '';
            let montoEjecutado = 0;
            let montoDisponible = 0;
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
            const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [EJECUTADO, DISPONIBLE] });
            filters.push(filterTwo);

            //param2 = parseFloat(objRecord.getValue('custrecord_lh_cp_dt_disponible')); //!Revisar paramétro ya que en parcial concula con el total
            param2 = monto;

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
                montoEjecutado = montoEjecutado - param2;

                openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                let saveRecord2 = openRecord2.save();
                let saveRecord3 = openRecord3.save();
                log.debug('Records', saveRecord2 + ' - ' + saveRecord3);
                //!USER EVENT
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
            }
        } catch (error) {
            log.error('Error-pptoLiberadoAplicado', error)
        }
    }


    const procesoPago = (id) => {
        try {
            log.debug('INICIO', 'INICIO PAGO ====================================');
            let recordId = id
            log.debug('Params', recordId);
            let arrayDeletePay = '';
            let paramJson = '';

            let arrayPayDetails = search.lookupFields({ type: search.Type.TRANSACTION, id: recordId, columns: ['custbody_lh_categories_id_flag'] });
            arrayPayDetails = arrayPayDetails.custbody_lh_categories_id_flag;
            if (arrayPayDetails.length != 0) {
                arrayDeletePay = JSON.parse(arrayPayDetails);
                //arrayDeletePay = deletePay(recordId, arrayPayDetails);
                mappingPay(recordId);
            } else {
                arrayDeletePay = new Array();
            }
            let arrayAddPay = addPay(recordId, arrayDeletePay);

            //*Set Final-Payment =======================================================
            if (arrayAddPay.length != 0) {
                paramJson = JSON.stringify(arrayAddPay);
            }
            record.submitFields({
                type: record.Type.VENDOR_PAYMENT,
                id: recordId,
                values: {
                    'custbody_lh_categories_id_flag': JSON.stringify(arrayAddPay)
                }
            });
            log.debug('FIN', 'FIN PAGO ====================================');
        } catch (error) {
            log.error('Error-execute', error)
            log.debug('ERROR', 'FIN PAGO ====================================');
        }
    }

    const addPay = (recordId, arrayPayDetails) => {
        log.debug('START', 'PAY ADD ====================================');
        let transactionType = '';
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
            let lookupFields = search.lookupFields({ type: search.Type.TRANSACTION, id: billId, columns: ['custbody_lh_categories_id_flag', 'type'] });
            transactionType = lookupFields.type[0].value;
            log.debug('Transaction', transactionType);
            let categoriesArray = JSON.parse(lookupFields.custbody_lh_categories_id_flag);
            let newCategoriesArray = JSON.parse(lookupFields.custbody_lh_categories_id_flag);
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
                        log.debug('Monto a pagar Antes', categoriesArray[k][1] + ' - ' + typeof categoriesArray[k][1]);
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
                    arrayPayDetails.push([billId.toString(), internalId.toString(), parseFloat(monto)]);
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

                if (transactionType == EXPENSE_REPORT_TYPE) {
                    record.submitFields({
                        type: record.Type.EXPENSE_REPORT,
                        id: billId,
                        values: {
                            'custbody_lh_cp_estado_ppto_oc': PAGADO,
                            'custbody_lh_payment_status_flag': 'paid',
                        }
                    });
                } else {
                    newCategoriesArray.map((dato) => {
                        dato[1] = 0;
                        return dato;
                    });
                    record.submitFields({
                        type: record.Type.VENDOR_BILL,
                        id: billId,
                        values: {
                            'custbody_lh_cp_estado_ppto_oc': PAGADO,
                            'custbody_lh_payment_status_flag': 'paid',
                            'custbody_lh_categories_id_flag': JSON.stringify(newCategoriesArray)
                        }
                    });
                }

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
        log.debug('END', 'PAY ADD ====================================');
        return arrayPayDetails;
    }

    const deletePay = (recordId, arrayPayDetails) => {
        log.debug('START', 'PAY DELETE ====================================');
        let param1 = 0;
        let param2 = 0;
        let statusEjecutado = '';
        let statusPagado = '';
        let montoEjecutado = 0;
        let montoPagado = 0;
        let statusDet = '';
        let arrayMulti = new Array();
        let pagadoFlag = 0;
        let ordenrelacionada = '';

        let mappingpay = mappingPay(recordId);
        for (let i in arrayPayDetails) {
            let transactionid = arrayPayDetails[i][0];
            for (let m in mappingpay) {
                let exist = mappingpay[m].includes(transactionid);
                if (exist == false) {
                    let lookupFields = search.lookupFields({
                        type: search.Type.TRANSACTION,
                        id: transactionid,
                        columns: ['custbody_lh_categories_id_flag', 'type', 'trandate', 'custbody_lh_anio_id_flag', 'custbody_lh_temporalidad_flag']
                    });
                    log.debug('New-lookupFields', lookupFields);
                    let type = lookupFields.type;
                    let date = lookupFields.trandate;
                    let month = getMonth(date);
                    let year = lookupFields.custbody_lh_anio_id_flag;
                    let temporalidad = lookupFields.custbody_lh_temporalidad_flag;
                    let arrayCategorias = JSON.parse(lookupFields.custbody_lh_categories_id_flag);
                    log.debug('arrayCategorias', arrayCategorias);

                    //for (let i in arrayCategorias) {
                    log.debug('Init-arrayCategorias', 'Detalle: ' + arrayPayDetails[i][1] + ' - Monto: ' + arrayPayDetails[i][2]);
                    let lookupFields2 = search.lookupFields({
                        type: DETALLE_TRANSACCION_RECORD,
                        id: arrayCategorias[i][1],
                        columns: [
                            'custrecord_lh_cp_dt_category_ppto',
                            'custrecord_lh_cp_dt_pagado',
                            'custrecord_lh_cp_dt_pago_relacionado',
                            'custrecord_lh_cp_dt_purchase_ord_related',
                            'custrecord_lh_cp_dt_ejecutado'
                        ]
                    });

                    param2 = parseFloat(arrayPayDetails[i][2]);
                    let category = lookupFields2.custrecord_lh_cp_dt_category_ppto[0].value;
                    let pagado = parseFloat(lookupFields2.custrecord_lh_cp_dt_pagado);
                    let ejecutado = parseFloat(lookupFields2.custrecord_lh_cp_dt_ejecutado);
                    let pagorelacionado = lookupFields2.custrecord_lh_cp_dt_pago_relacionado;
                    ordenrelacionada = lookupFields2.custrecord_lh_cp_dt_purchase_ord_related[0].value;

                    pagado = pagado - param2;
                    log.debug('Cálculo', pagado + ' = ' + pagado + ' - ' + param2);

                    if (pagado > 0) {
                        statusDet = PAGADO;
                        if (type == EXPENSE_REPORT_TYPE) {
                            arrayMulti = '';
                        }
                    } else {
                        statusDet = EJECUTADO;
                        if (type == EXPENSE_REPORT_TYPE) {
                            arrayMulti = '';
                        }
                        pagadoFlag = 1;
                    }

                    if (type == VENDOR_BILL_TYPE) {
                        for (let j in pagorelacionado) {
                            if (pagorelacionado[j].value != recordId) {
                                arrayMulti.push(pagorelacionado[j].value);
                            }
                        }
                    }
                    record.submitFields({
                        type: DETALLE_TRANSACCION_RECORD,
                        id: arrayPayDetails[i][1],
                        values: {
                            'custrecord_lh_cp_dt_pagado': pagado,
                            'custrecord_lh_cp_dt_ejecutado': param2 + ejecutado,
                            'custrecord_lh_cp_dt_estado_busqueda': statusDet,
                            'custrecord_lh_cp_dt_pago_relacionado': arrayMulti,
                        }
                    });
                    log.debug('Proceso-Anulación', 'Transacción ' + context.newRecord.id + ' con detalle: ' + arrayPayDetails[i][1] + ' pago anulado');

                    //TODO: Actualización de PPTO
                    let objSearch2 = search.load({ id: CATEGORIA_PPTO_PERIODOS });
                    let filters2 = objSearch2.filters;
                    let filterFour = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
                    filters2.push(filterFour);
                    let filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
                    filters2.push(filterThree);
                    let filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [EJECUTADO, PAGADO] });
                    filters2.push(filterTwo);
                    let result = objSearch2.run().getRange({ start: 0, end: 5 });

                    if (temporalidad == TEMPORALIDAD_MENSUAL || temporalidad == TEMPORALIDAD_TRIMESTRAL || temporalidad == TEMPORALIDAD_ANUAL) {
                        for (let i in result) {
                            let lhStatus = result[i].getValue({ name: "custrecord_lh_detalle_cppto_status" });
                            if (lhStatus == EJECUTADO) {
                                statusEjecutado = result[i].getValue({ name: "internalId" });
                                montoEjecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            } else if (lhStatus == PAGADO) {
                                statusPagado = result[i].getValue({ name: "internalId" });
                                montoPagado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                            }
                        }
                        let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                        let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusPagado, isDynamic: true });

                        montoEjecutado = montoEjecutado + param2;
                        montoPagado = montoPagado - param2;

                        openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                        openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoPagado });
                        let saveRecord2 = openRecord2.save();
                        let saveRecord1 = openRecord1.save();
                        log.debug('Period-Records', saveRecord2 + ' - ' + saveRecord1);

                        //!USER EVENT
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                        setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord1);
                    }
                    // }

                    if (pagadoFlag == 0) {
                        if (type == VENDOR_BILL_TYPE) {
                            record.submitFields({
                                type: record.Type.VENDOR_BILL,
                                id: transactionid,
                                values: {
                                    'custbody_lh_cp_estado_ppto_oc': EJECUTADO,
                                    'custbody_lh_payment_status_flag': ''
                                }
                            });
                        } else {
                            record.submitFields({
                                type: record.Type.EXPENSE_REPORT,
                                id: transactionid,
                                values: {
                                    'custbody_lh_payment_status_flag': ''
                                }
                            });
                        }
                    } else {
                        if (type == VENDOR_BILL_TYPE) {
                            record.submitFields({
                                type: record.Type.VENDOR_BILL,
                                id: transactionid,
                                values: {
                                    'custbody_lh_cp_estado_ppto_oc': EJECUTADO,
                                    'custbody_lh_payment_status_flag': ''
                                }
                            });
                            if (ordenrelacionada.length != 0) {
                                record.submitFields({
                                    type: record.Type.PURCHASE_ORDER,
                                    id: ordenrelacionada,
                                    values: {
                                        'custbody_lh_cp_estado_ppto_oc': EJECUTADO
                                    }
                                });
                            }
                        } else {
                            record.submitFields({
                                type: record.Type.EXPENSE_REPORT,
                                id: transactionid,
                                values: {
                                    'custbody_lh_cp_estado_ppto_oc': EJECUTADO,
                                    'custbody_lh_payment_status_flag': ''
                                }
                            });
                        }
                    }
                    arrayPayDetails.splice(m, 1);
                }
            }
        }
        log.debug('END', 'PAY DELETE ====================================');
        return arrayPayDetails;
    }

    const mappingPay = (recordId) => {
        let json = new Array();
        let objSearch = search.load({ id: BP_PAYMENT_LINES_VOID_SEARCH });
        let filters = objSearch.filters;
        let filterOne = search.createFilter({ name: 'internalId', operator: search.Operator.ANYOF, values: recordId });
        filters.push(filterOne);
        let result = objSearch.run().getRange({ start: 0, end: 50 });
        log.debug('Result-Mapping', result);
        for (let k in result) {
            let transactionid = result[k].getValue({ name: "appliedtotransaction", summary: "GROUP" });
            json.push(transactionid);
        }
        log.debug('MAPPING', json);
        return json;
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
                    type: search.Type.TRANSACTION,
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


    const pptoAnulado = (recordId, monto) => {
        let action = '';
        let objPurchaseOrder = '';
        try {
            let param2 = 0;
            let statusComprometido = '';
            let statusEjecutado = '';
            let montoComprometido = 0;
            let montoEjecutado = 0;
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
            const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [COMPROMETIDO, EJECUTADO] });
            filters.push(filterTwo);

            param2 = monto;
            let result = objSearch.run().getRange({ start: 0, end: 5 });
            if (temporalidad == TEMPORALIDAD_MENSUAL || temporalidad == TEMPORALIDAD_TRIMESTRAL || temporalidad == TEMPORALIDAD_ANUAL) {
                for (let i in result) {
                    let lhStatus = result[i].getValue({ name: "custrecord_lh_detalle_cppto_status" });
                    if (lhStatus == COMPROMETIDO) {
                        statusComprometido = result[i].getValue({ name: "internalId" });
                        montoComprometido = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                    } else if (lhStatus == EJECUTADO) {
                        statusEjecutado = result[i].getValue({ name: "internalId" });
                        montoEjecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                    }
                }
                let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusComprometido, isDynamic: true });
                let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });

                montoComprometido = montoComprometido + param2;
                montoEjecutado = montoEjecutado - param2;

                openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoComprometido });
                openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                let saveRecord2 = openRecord2.save();
                let saveRecord3 = openRecord3.save();
                log.debug('Records', saveRecord2 + ' - ' + saveRecord3);

                //!USER EVENT
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
            }
        } catch (error) {
            log.error('Error-pptoAnulado', error);
        }
    }


    const getConfig = (transaction, subsidiary) => {
        try {
            let objSearch = search.load({ id: CONFIG_PPTO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_cp_transaccion', operator: search.Operator.ANYOF, values: transaction });
            filters.push(filterOne);
            const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
            filters.push(filterTwo);
            const filterThree = search.createFilter({ name: 'custrecord_lh_cp_flujo_aprobacion', operator: search.Operator.IS, values: true });
            filters.push(filterThree);

            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount != 0) {
                let resultConfig = objSearch.run().getRange({ start: 0, end: 1 });
                let temporalidad = resultConfig[0].getValue(objSearch.columns[0]);
                let desviacion = resultConfig[0].getValue(objSearch.columns[1]);

                return {
                    temporalidad: temporalidad,
                    desviacion: desviacion
                }
            } else {
                return 0;
            }
        } catch (error) {
            log.error(error)
        }
    }


    const executeCreated = (recordId, objOC) => {
        let objSearch;
        let join = '';
        let tipoCambio = 1;
        let arrayCategoriasFirst = '';
        let subsidiary = objOC.subsidiary[0].value;
        let temporalidad = objOC.custbody_lh_temporalidad_flag;
        let nivelControl = objOC.custbody_lh_nivel_control_flag;
        let subList = objOC.custbody_lh_sublist_type_flag;
        let currency = objOC.currency[0].value;
        let updateFlag = objOC.custbody_lh_update_flag;
        let transaction = '';
        let arrayCategorias = new Array();

        if (temporalidad.length != 0 && subList.length != 0) {
            //*identificación de lista de acuerdo a transacción
            if (subList == ITEM_SUBLIST) {
                objSearch = search.load({ id: PO_ITEM_LINES_SEARCH });
                join = 'item';
                transaction = TRANSACTION_PURCHASE_ORDER;
            } else if (subList == EXPENSE_SUBLIST) {
                objSearch = search.load({ id: PO_EXPENSE_LINES_SEARCH });
                join = 'expenseCategory';
                transaction = TRANSACTION_PURCHASE_ORDER;
            } else if (subList == JOURNAL_SUBLIST) {
                objSearch = search.load({ id: JE_LINE_LINES_SEARCH });
                transaction = TRANSACTION_JOURNAL_ENTRY;
                if (updateFlag == 1) {
                    arrayCategoriasFirst = JSON.parse(objOC.custbody_lh_categories_id_edit_flag);
                } else if (updateFlag.length == 0) {
                    arrayCategoriasFirst = JSON.parse(objOC.custbody_lh_categories_id_flag);
                }
            }

            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: recordId });
            filters.push(filterOne);
            if (subList != JOURNAL_SUBLIST && objOC.custbody_lh_categories_id_flag.length != 0) {
                const filterTwo = search.createFilter({ name: 'subsidiary', join: join, operator: search.Operator.ANYOF, values: subsidiary });
                filters.push(filterTwo);
            }
            //* =====> INIT RESULTS 
            let results = objSearch.run().getRange({ start: 0, end: 200 });
            log.debug('Res', results);
            let date = results[0].getValue(objSearch.columns[6]);
            let month = getMonth(date);
            let year = results[0].getValue(objSearch.columns[7]);
            let anio = date.split('/')[2];
            if (year == '- None -') {
                year = getAnioId(anio); //! FUNCTION => getAnioId
            }
            let internalidPeriod = getPeriod(month, anio); //! FUNCTION => getPeriod
            if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                tipoCambio = getTipoCambio(subsidiary, internalidPeriod); //! FUNCTION => getTipoCambio
            }
            //let temporalidad = results[0].getValue(objSearch.columns[9]);
            //*recorrido de líneas de detalle
            for (let i in results) {
                let amount = 0;
                let deparment = results[i].getValue(objSearch.columns[2]);
                let subsidiary = results[i].getValue(objSearch.columns[3]);
                let account = results[i].getValue(objSearch.columns[4]);
                let category = results[i].getValue(objSearch.columns[5]);
                if (subList == JOURNAL_SUBLIST) {
                    log.debug('LENGTH', objOC.custbody_lh_categories_id_flag.length);
                    if (objOC.custbody_lh_categories_id_flag.length > 1) {
                        for (let j in arrayCategoriasFirst) {
                            if (arrayCategoriasFirst[j][0] == deparment) {
                                amount = parseFloat(arrayCategoriasFirst[j][1]);
                                break;
                            }
                        }
                    } else {
                        amount = 0;
                    }
                } else {
                    amount = parseFloat(results[i].getValue(objSearch.columns[9]));
                }
                amount = amount / tipoCambio;

                let response = getPresupuesto(category, year, month, temporalidad, recordId, deparment, subsidiary, account, amount, nivelControl, transaction, internalidPeriod, tipoCambio); //! FUNCTION => getPresupuesto
                arrayCategorias.push([response.toString(), amount]);
                log.debug('Detalle-Transacción', response);
            }
            let scriptObj = runtime.getCurrentScript();
            log.debug('Remaining governance', 'units => ' + scriptObj.getRemainingUsage());

            if (transaction == TRANSACTION_JOURNAL_ENTRY && objOC.custbody_lh_categories_id_flag.length > 1) {
                log.debug('arrayCategorias', arrayCategorias);
                record.submitFields({
                    type: record.Type.JOURNAL_ENTRY,
                    id: recordId,
                    values: {
                        'custbody_lh_update_flag': '',
                        'custbody_lh_categories_id_flag': JSON.stringify(arrayCategorias),
                        'custbody_lh_categories_id_edit_flag': ''
                    }
                });
            } else {
                record.submitFields({
                    type: record.Type.PURCHASE_ORDER,
                    id: recordId,
                    values: {
                        'custbody_lh_update_flag': '',
                        'custbody_lh_categories_id_flag': JSON.stringify(arrayCategorias)
                    }
                });
            }
        } else {
            log.debug('Configuración', 'No se generó la temporalidad, sublista o no aplica ppto')
        }


    }


    const executeCreatedIG = (recordId, objOC) => {
        let objSearch;
        let join = '';
        let tipoCambio = 1;
        let account = 0;
        let subsidiary = objOC.getValue('subsidiary');
        let temporalidad = objOC.getValue('custbody_lh_temporalidad_flag');
        let nivelControl = objOC.getValue('custbody_lh_nivel_control_flag');
        let deparment = objOC.getValue('department');
        let firstAmount = parseFloat(objOC.getValue('custbody_lh_categories_id_flag'));
        let currency = objOC.getValue('currency');
        // let advance = objOC.getValue('advance');
        let category = objOC.getValue('custbody_lh_ppto_flag_body');
        let amount = objOC.getValue('custbody_lh_amount_flag');
        let year = objOC.getValue('custbody_lh_anio_id_flag');
        let date = objOC.getValue({ fieldId: 'trandate' });
        date = sysDate(date); //! sysDate (FUNCTION)
        let month = date.month;
        let anio = date.year;
        let internalidPeriod = getPeriod(month, anio); //! FUNCTION => getPeriod
        if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
            tipoCambio = getTipoCambio(subsidiary, internalidPeriod); //! FUNCTION => getTipoCambio
        }
        if (temporalidad.length != 0) {
            let response = getPresupuesto(category, year, month, temporalidad, recordId, deparment, subsidiary, account, amount, nivelControl, TRANSACTION_EXPENSE_REPORT, internalidPeriod, tipoCambio); //! FUNCTION => getPresupuesto

            log.debug('Detalle-Transacción', response);
            let scriptObj = runtime.getCurrentScript();
            log.debug('Remaining governance', 'units => ' + scriptObj.getRemainingUsage());

            let arrayDetalle = [[response.toString(), firstAmount]];
            record.submitFields({
                type: record.Type.EXPENSE_REPORT,
                id: recordId,
                values: {
                    'custbody_lh_categories_id_flag': JSON.stringify(arrayDetalle),
                }
            });
        } else {
            log.debug('Configuración', 'No se generó la temporalidad o sublista')
        }
    }


    const executeReverseReservado = (category, year, month, reservado) => {
        try {
            log.debug('Execute', 'Entré a reversa reservado');
            let saveRecord1 = 0;
            let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
            filters.push(filterOne);
            const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
            filters.push(filterThree);

            const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: RESERVADO });
            filters.push(filterTwo);

            let result = objSearch.run().getRange({ start: 0, end: 1 });
            let statusReservado = result[0].getValue({ name: "internalid" });
            let montoReservado = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));

            montoReservado = montoReservado - reservado;
            log.debug('Monto-Reservado', montoReservado)

            let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusReservado, isDynamic: true });
            openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoReservado });
            saveRecord1 = openRecord1.save();

            if (statusReservado == saveRecord1) {
                return 1;
            } else {
                return 0;
            }
        } catch (error) {
            log.error('Error-executeReverse', error);
        }
    }


    const executeReverseComprometido = (category, year, month, monto, transaction = 0, createdfrom = 0) => {
        try {
            log.debug('Execute', 'Entré a reversa comprometido o ejecutado');
            let saveRecord2 = 0;
            let saveRecord1 = 0;
            let saveRecord3 = 0;
            let statusEjecutado = 0;
            let montoEjecutado = 0;
            let statusComprometido = 0;
            let montoComprometido = 0
            let statusDisponible = 0
            let montoDisponible = 0
            let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
            filters.push(filterOne);
            const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
            filters.push(filterThree);
            const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [EJECUTADO, COMPROMETIDO, DISPONIBLE] });
            filters.push(filterTwo);
            let result = objSearch.run().getRange({ start: 0, end: 50 });
            for (let i in result) {
                let lhStatus = result[i].getValue({ name: "custrecord_lh_detalle_cppto_status" });
                if (lhStatus == EJECUTADO) {
                    statusEjecutado = result[i].getValue({ name: "internalid" });
                    montoEjecutado = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                } else if (lhStatus == COMPROMETIDO) {
                    statusComprometido = result[i].getValue({ name: "internalid" });
                    montoComprometido = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                } else if (lhStatus == DISPONIBLE) {
                    statusDisponible = result[i].getValue({ name: "internalid" });
                    montoDisponible = parseFloat(result[i].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                }
            }

            if (transaction == VENDOR_BILL) {
                if (createdfrom.length != 0 && createdfrom != 0) {
                    montoEjecutado = montoEjecutado - monto; //!ComprometidoFlag =monto ejecutado
                    log.debug('Resta ejecutado', montoEjecutado + ' = ' + ' ' + montoEjecutado + ' - ' + monto);
                    let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                    openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                    saveRecord1 = openRecord1.save();

                    montoComprometido = montoComprometido + monto;
                    log.debug('Resta comprometido', montoComprometido + ' = ' + ' ' + montoComprometido + ' + ' + monto);
                    let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusComprometido, isDynamic: true });
                    openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoComprometido });
                    saveRecord2 = openRecord2.save();
                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                } else {
                    montoEjecutado = montoEjecutado - monto; //!ComprometidoFlag =monto ejecutado
                    log.debug('Resta ejecutado', montoEjecutado + ' = ' + ' ' + montoEjecutado + ' - ' + monto);
                    let openRecord1 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                    openRecord1.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                    saveRecord1 = openRecord1.save();

                    montoDisponible = montoDisponible + monto;
                    log.debug('Devuelve disponible', montoDisponible + ' = ' + ' ' + montoDisponible + ' - ' + monto);
                    let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusDisponible, isDynamic: true });
                    openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                    saveRecord3 = openRecord3.save();
                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
                }
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord1);

                if (statusEjecutado == saveRecord1) {
                    return 1;
                } else {
                    return 0;
                }
            } else if (transaction == JOURNAL_ENTRY) {
                montoEjecutado = montoEjecutado - monto;
                log.debug('Resta comprometido', montoEjecutado + ' = ' + ' ' + montoEjecutado + ' - ' + monto);
                let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                saveRecord2 = openRecord2.save();

                montoDisponible = montoDisponible + monto;
                log.debug('Devuelve disponible', montoDisponible + ' = ' + ' ' + montoDisponible + ' - ' + monto);
                let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusDisponible, isDynamic: true });
                openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                saveRecord3 = openRecord3.save();

                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);

                if (statusDisponible == saveRecord3) {
                    return 1;
                } else {
                    return 0;
                }
            } else if (transaction == VENDOR_CREDIT) {
                montoEjecutado = montoEjecutado + monto;
                log.debug('Resta comprometido', montoEjecutado + ' = ' + ' ' + montoEjecutado + ' - ' + monto);
                let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                saveRecord2 = openRecord2.save();

                montoDisponible = montoDisponible - monto;
                log.debug('Devuelve disponible', montoDisponible + ' = ' + ' ' + montoDisponible + ' - ' + monto);
                let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusDisponible, isDynamic: true });
                openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                saveRecord3 = openRecord3.save();

                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);

                if (statusDisponible == saveRecord3) {
                    return 1;
                } else {
                    return 0;
                }
            } else {
                montoComprometido = montoComprometido - monto;
                log.debug('Resta comprometido', montoComprometido + ' = ' + ' ' + montoComprometido + ' - ' + monto);
                let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusComprometido, isDynamic: true });
                openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoComprometido });
                saveRecord2 = openRecord2.save();

                montoDisponible = montoDisponible + monto;
                log.debug('Devuelve disponible', montoDisponible + ' = ' + ' ' + montoDisponible + ' - ' + monto);
                let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusDisponible, isDynamic: true });
                openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                saveRecord3 = openRecord3.save();

                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);

                if (statusDisponible == saveRecord3) {
                    return 1;
                } else {
                    return 0;
                }
            }
        } catch (error) {
            log.error('Error-executeReverse', error);
        }
    }


    const getPresupuesto = (category, year, month, temporalidad, recordId, deparment, subsidiary, account, amount_required, nivelControl, transaction, internalidPeriod, tipoCambio) => {
        let disponible = 0;
        let arregloTrimestre = 0;
        let suma = 0;
        let amount = amount_required;
        log.debug('Mes', month);
        try {
            let objCreate = record.create({ type: DETALLE_TRANSACCION_RECORD, isDynamic: true });
            objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_subsidiaria', value: subsidiary });
            objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_category_ppto', value: category });
            objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_periodo', value: internalidPeriod });
            objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_tipo_cambio', value: tipoCambio });
            log.debug('nivelControl', nivelControl);
            if (nivelControl == CECO_NIVEL_CONTROL) {
                log.debug('deparment', deparment);
                // if (transaction == TRANSACTION_EXPENSE_REPORT) {
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_centro_costo', value: deparment });
                // } else {
                //     let lookupFieldsCECO = search.lookupFields({ type: CATEGORIA_PRESUPUESTO_RECORD, id: category, columns: ['custrecord_lh_cp_centro_costo'] });
                //     log.debug('lookupFieldsCECO', lookupFieldsCECO);
                //     lookupFieldsCECO = lookupFieldsCECO.custrecord_lh_cp_centro_costo[0].value;
                //     objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_centro_costo', value: lookupFieldsCECO });
                // }

            }
            if (nivelControl == CUENTA_NIVEL_CONTROL) {
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_cuenta_contable', value: account });
            }
            if (transaction == TRANSACTION_PURCHASE_ORDER || transaction == TRANSACTION_EXPENSE_REPORT) {
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_reservado', value: amount });
                if (transaction == TRANSACTION_PURCHASE_ORDER) {
                    objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_purchase_ord_related', value: recordId });
                }
                if (transaction == TRANSACTION_EXPENSE_REPORT) {
                    objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_factura_relacionada', value: recordId });
                }
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_estado_busqueda', value: RESERVADO });
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_accion_ppto', value: RESERVADO });

                let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
                let filters = objSearch.filters;
                const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
                filters.push(filterOne);
                const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: DISPONIBLE });
                filters.push(filterTwo);
                const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
                filters.push(filterThree);

                let result = objSearch.run().getRange({ start: 0, end: 1 });

                if (temporalidad == TEMPORALIDAD_MENSUAL) {
                    disponible = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                } else if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
                    for (let i in trimestre) {
                        let bloque = trimestre[i].includes(month);
                        if (bloque == true) {
                            arregloTrimestre = parseInt(i);
                            break;
                        }
                    }
                    for (let i in trimestre[arregloTrimestre]) {
                        let elemento = trimestre[arregloTrimestre][i];
                        let monto = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + elemento }));
                        suma += monto
                    }
                    disponible = suma;
                } else if (temporalidad == TEMPORALIDAD_ANUAL) {
                    for (let i in anual) {
                        let monto = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + anual[i] }));
                        suma += monto
                    }
                    disponible = suma;
                }

                if (amount <= disponible) {
                    objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_disponible', value: amount });
                } else {
                    objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_disponible', value: disponible });
                }

                let response = objCreate.save();
                updatePresupuesto(month, year, category, amount);
                return response;
            } else if (transaction == TRANSACTION_JOURNAL_ENTRY) {
                //!Ejecutado Directo Jorunal ===================
                log.debug('Amount', amount);
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_ejecutado', value: amount });
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_pago_relacionado', value: [recordId] });
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_estado_busqueda', value: EJECUTADO });
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_accion_ppto', value: EJECUTADO });
                let response = objCreate.save();

                let statusEjecutado = '';
                let statusDisponible = '';
                let montoEjecutado = 0;
                let montoDisponible = 0;

                let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
                let filters = objSearch.filters;
                const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
                filters.push(filterOne);
                const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
                filters.push(filterThree);
                const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [DISPONIBLE, EJECUTADO] });
                filters.push(filterTwo);

                let param2 = parseFloat(amount)
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

                    //TODO CALCULOS ===================================================================
                    montoDisponible = montoDisponible - param2;
                    montoEjecutado = montoEjecutado + param2;

                    let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusDisponible, isDynamic: true });
                    let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                    openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                    openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                    let saveRecord2 = openRecord2.save();
                    let saveRecord3 = openRecord3.save();
                    log.debug('Records', saveRecord2 + ' - ' + saveRecord3 + ' - Categorías actualizadas');
                    //!USER EVENT
                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
                    return response;
                }
            } else {
                //!Ejecución Bill Directa ===============
                log.debug('Amount', amount);
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_ejecutado', value: amount });
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_factura_relacionada', value: [recordId] });
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_estado_busqueda', value: EJECUTADO });
                objCreate.setValue({ fieldId: 'custrecord_lh_cp_dt_accion_ppto', value: EJECUTADO });
                let response = objCreate.save();

                let statusEjecutado = '';
                let statusDisponible = '';
                let montoEjecutado = 0;
                let montoDisponible = 0;

                let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
                let filters = objSearch.filters;
                const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
                filters.push(filterOne);
                const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
                filters.push(filterThree);
                const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: [DISPONIBLE, EJECUTADO] });
                filters.push(filterTwo);

                let param2 = parseFloat(amount)
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

                    //TODO CALCULOS ===================================================================
                    montoDisponible = montoDisponible - param2;
                    montoEjecutado = montoEjecutado + param2;

                    let openRecord2 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusDisponible, isDynamic: true });
                    let openRecord3 = record.load({ type: CATEGORIA_PERIODO_RECORD, id: statusEjecutado, isDynamic: true });
                    openRecord2.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoDisponible });
                    openRecord3.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                    let saveRecord2 = openRecord2.save();
                    let saveRecord3 = openRecord3.save();
                    log.debug('Records', saveRecord2 + ' - ' + saveRecord3 + ' - Categorías actualizadas');
                    //!USER EVENT
                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord2);
                    setTotalPpto(CATEGORIA_PERIODO_RECORD, saveRecord3);
                    return response;
                }
            }
        } catch (error) {
            log.error('Error-getPresupuesto', error);
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
            log.error('Error-sysDate', e);
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


    const getAnioId = (year) => {
        let objSearch = search.load({ id: ID_AÑO_SEARCH });
        let filters = objSearch.filters;
        const filterOne = search.createFilter({ name: 'name', operator: search.Operator.IS, values: year });
        filters.push(filterOne);
        let resultConfig = objSearch.run().getRange({ start: 0, end: 1 });
        let anio = resultConfig[0].getValue(objSearch.columns[0]);
        return anio;
    }


    const getTipoCambio = (subsidiary, internalidPeriod) => {
        try {
            //let internalidPeriod = getPeriod(month, anio);
            let objSearch = search.load({ id: TIPO_CAMBIO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_tc_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
            filters.push(filterOne);
            const filterTwo = search.createFilter({ name: 'custrecord_lh_tc_periodo', operator: search.Operator.ANYOF, values: internalidPeriod });
            filters.push(filterTwo);
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                let tipoCambio = parseFloat(result[0].getValue({ name: "custrecord_lh_tc_tipo_cambio" }));
                let periodo = result[0].getText({ name: "custrecord_lh_tc_periodo" });
                // log.debug('Periodo',periodo);
                log.debug('Tipo Cambio', tipoCambio);
                return tipoCambio;
            } else {
                let objSearch = search.load({ id: TIPO_CAMBIO_SEARCH });
                let filters = objSearch.filters;
                const filterOne = search.createFilter({ name: 'custrecord_lh_tc_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
                filters.push(filterOne);
                let searchResultCount = objSearch.runPaged().count;
                if (searchResultCount != 0) {
                    let result = objSearch.run().getRange({ start: 0, end: 1 });
                    let tipoCambio = parseFloat(result[0].getValue({ name: "custrecord_lh_tc_tipo_cambio" }));
                    let periodo = result[0].getText({ name: "custrecord_lh_tc_periodo" });
                    //console.log('Periodo',periodo);
                    //console.log('Tipo Cambio', tipoCambio);
                    return tipoCambio;
                } else {
                    return 0;
                }
            }
        } catch (error) {
            log.error('Error-getTipoCambio', error);
        }

    }


    const updatePresupuesto = (month, year, category, reser) => {
        try {
            log.debug('INICIO', 'INICIO-CREATE ===========================');
            let reservado = reser
            let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
            filters.push(filterOne);
            const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: RESERVADO });
            filters.push(filterTwo);
            const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
            filters.push(filterThree);
            let result = objSearch.run().getRange({ start: 0, end: 1 });
            let internalId = result[0].getValue({ name: "internalid" });
            let openRecord = record.load({ type: CATEGORIA_PERIODO_RECORD, id: internalId, isDynamic: true });
            let amount = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
            amount = amount + reservado;
            //! ? = 100k + 120k
            log.debug('AmountSetear', amount);
            openRecord.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: amount });
            let rec = openRecord.save();
            //!USER EVENT
            setTotalPpto(CATEGORIA_PERIODO_RECORD, rec);
            log.debug('FIN', 'FIN-CREATE ==============================');
        } catch (error) {
            log.error('Error-updatePresupuesto', error);
        }
    }


    const getPeriod = (month, year) => {
        let period = '';
        try {
            if (month == '01') {
                period = 'ene ' + year;
            } else if (month == '02') {
                period = 'feb ' + year;
            } else if (month == '03') {
                period = 'mar ' + year;
            } else if (month == '04') {
                period = 'abr ' + year;
            } else if (month == '05') {
                period = 'may ' + year;
            } else if (month == '06') {
                period = 'jun ' + year;
            } else if (month == '07') {
                period = 'jul ' + year;
            } else if (month == '08') {
                period = 'ago ' + year;
            } else if (month == '09') {
                period = 'sep ' + year;
            } else if (month == '10') {
                period = 'oct ' + year;
            } else if (month == '11') {
                period = 'nov ' + year;
            } else if (month == '12') {
                period = 'dic ' + year;
            }
            log.debug('Period', period);
            let loadSearch = search.load({ id: PERIODO_SEARCH });
            let filters2 = loadSearch.filters;
            const filterOne2 = search.createFilter({ name: 'periodname', operator: search.Operator.STARTSWITH, values: period });
            filters2.push(filterOne2);
            let result2 = loadSearch.run().getRange({ start: 0, end: 1 });
            let internalidPeriod = result2[0].getValue({ name: "internalid" });
            log.debug('internalidPeriod', internalidPeriod);
            return internalidPeriod
        } catch (error) {
            log.error('Error-getPeriod', error);
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
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 13/07/2022
Author: Dennis Fernández
Description: Creación del script.
========================================================================================================================================================*/