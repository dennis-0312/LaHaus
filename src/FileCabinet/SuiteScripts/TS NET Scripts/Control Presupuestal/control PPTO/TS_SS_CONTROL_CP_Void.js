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
    const CATEGORIA_PERIODO_RECORD = 'customrecord_lh_categoriap_periodo';
    const DETALLE_TRANSACCION_RECORD = 'customrecord_lh_detalle_transaccion';
    const BILL_TRANSACTION = 'vendorbill';
    const BILL_CREDIT_TRANSACTION = 'vendorcredit';

    const execute = (context) => {
        try {
            let recordId = runtime.getCurrentScript().getParameter({ name: 'custscript_cp_void_invoice_recordid' });
            let action = ANULADO;
            let purchaseOrder = '';
            if (action == ANULADO) {
                let objSearch2 = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                let filters2 = objSearch2.filters;
                const filterOne2 = search.createFilter({ name: 'custrecord_lh_cp_dt_factura_relacionada', operator: search.Operator.ANYOF, values: recordId });
                filters2.push(filterOne2);

                let result2 = objSearch2.run().getRange({ start: 0, end: 100 });
                // log.debug('Result2', result2)
                purchaseOrder = result2[0].getValue({ name: "custrecord_lh_cp_dt_purchase_ord_related" });

                for (let j in result2) {
                    let internalId = result2[j].getValue({ name: "internalId" });
                    // log.debug('DetalleId', internalId);
                    let ejecutado = parseFloat(result2[j].getValue({ name: "custrecord_lh_cp_dt_ejecutado" }));

                    if (purchaseOrder.length != 0) {
                        record.submitFields({
                            type: DETALLE_TRANSACCION_RECORD,
                            id: internalId,
                            values: {
                                'custrecord_lh_cp_dt_ejecutado': 0.00,
                                'custrecord_lh_cp_dt_comprometido': ejecutado,
                                'custrecord_lh_cp_dt_factura_relacionada': '',
                                'custrecord_lh_cp_dt_estado_busqueda': COMPROMETIDO,
                                'custrecord_lh_cp_dt_accion_ppto': ANULADO
                            }
                        });
                    } else {
                        record.submitFields({
                            type: DETALLE_TRANSACCION_RECORD,
                            id: internalId,
                            values: {
                                'custrecord_lh_cp_dt_ejecutado': 0.00,
                                'custrecord_lh_cp_dt_disponible': ejecutado,
                                'custrecord_lh_cp_dt_estado_busqueda': ANULADO,
                                'custrecord_lh_cp_dt_accion_ppto': ANULADO
                            }
                        });
                    }
                    //log.debug('recordDetalle', recordDetalle);
                }

                if (purchaseOrder.length != 0) {
                    record.submitFields({
                        type: record.Type.PURCHASE_ORDER,
                        id: purchaseOrder,
                        values: {
                            'custbody_lh_cp_estado_ppto_oc': COMPROMETIDO,
                        }
                    });
                }

                record.submitFields({
                    type: record.Type.VENDOR_BILL,
                    id: recordId,
                    values: {
                        'custbody_lh_cp_estado_ppto_oc': ANULADO
                    }
                });
            }
            log.debug('Save', save);
        } catch (error) {
            log.error('Error-execute', error)
        }
    }


    // let json = [["6", 944.06]]
    //         let idbill = 156895
    //         let save = record.submitFields({
    //             type: record.Type.VENDOR_BILL,
    //             id: idbill,
    //             values: {
    //                 'custbody_lh_categories_id_flag': JSON.stringify(json)
    //             }
    //         });

    return {
        execute: execute
    }
});
