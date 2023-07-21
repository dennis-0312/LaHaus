/**
 *@NApiVersion 2.1
 *@NModuleScope Public
 *@NScriptType Suitelet
 */
define(['N/log', 'N/ui/serverWidget', 'N/record', 'N/search', 'N/email', 'N/task'], (log, serverWidget, record, search, email, task) => {
    const DETALLE_TRANSACCION_SEARCH = 'customsearch_co_detalle_transac_search'; //CO Detalle Transacción Search - CP PRODUCCION
    const DETALLE_TRANSACCION_RECORD = 'customrecord_lh_detalle_transaccion';
    const RESERVADO = 2;
    const COMPROMETIDO = 3;
    const EJECUTADO = 4;
    const PAGADO = 5;
    const DIRECTO = 10;
    const TRANSACTION_TYPE_EXPENSE_REPORT = 'exprept';
    const PURCHASE_ORDER = 'purchaseorder';
    const EXPENSE_REPORT = 'expensereport';
    const APPROVAL_STATUS = 'approvalstatus';
    const PENDING_APPROVAL = 1;
    const APPROVED = '2';
    const REJECTED = '3';

    const onRequest = (context) => {
        var objClass = {};
        if (context.request.method === 'GET') {
            log.error('JSON', context.request.parameters.data);
            var fields = context.request.parameters.data.split('.');
            var recordType = fields[0];
            var idRecord = fields[1];
            var Aprobado = fields[2];
            var autor = fields[3];
            var aprobador = fields[4];
            var estado = '';
            let calculo = 0;
            let estadoFlag = '';
            let anticipo = 0;
            let totalAmount = 0;
            let SO = '';
            //exprept
            //recordType = recordType == EXPENSE_REPORT ? EXPENSE_REPORT : PURCHASE_ORDER;
            if (recordType == EXPENSE_REPORT || recordType == TRANSACTION_TYPE_EXPENSE_REPORT) {
                recordType = EXPENSE_REPORT;
            } else {
                recordType = PURCHASE_ORDER;
            }
            var campoEstado = recordType == EXPENSE_REPORT ? APPROVAL_STATUS : APPROVAL_STATUS;
            var TipoEstatusNuevo = recordType == EXPENSE_REPORT ? APPROVED : APPROVED;
            // var currentRecord = record.load({ type:  recordType, id: idRecord });
            if (Aprobado == 'NO') {
                TipoEstatusNuevo = recordType == EXPENSE_REPORT ? REJECTED : REJECTED;
            } else {
                //! COMPROMETER PPTO
                // var objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                // var filters = objSearch.filters;
                // if (recordType == PURCHASE_ORDER) {
                //     const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: idRecord });
                //     filters.push(filterOne);
                // } else if (recordType == EXPENSE_REPORT) {
                //     const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_factura_relacionada', operator: search.Operator.ANYOF, values: idRecord });
                //     filters.push(filterOne);
                //     // let lookupFields = search.lookupFields({ type: search.Type.TRANSACTION, id: idRecord, columns: ['custbody_lh_amount_flag'] });
                //     // totalAmount = parseFloat(lookupFields.custbody_lh_amount_flag);
                // }
                // var result = objSearch.run().getRange({ start: 0, end: 100 });
                // for (var i in result) {
                //     estado = result[i].getValue({ name: "custrecord_lh_cp_dt_estado_busqueda" });
                //     var reservado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_reservado" }));
                //     var internalId = result[i].getValue({ name: "internalId" });
                //     //let tipoCambio = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_tipo_cambio" }));
                //     log.error('internalId', internalId);
                //     if (estado == RESERVADO) {
                //         if (recordType == PURCHASE_ORDER) {
                //             var curRecord = record.submitFields({
                //                 type: DETALLE_TRANSACCION_RECORD,
                //                 id: internalId,
                //                 values: {
                //                     'custrecord_lh_cp_dt_reservado': 0.00,
                //                     'custrecord_lh_cp_dt_disponible': 0.00,
                //                     'custrecord_lh_cp_dt_comprometido': reservado,
                //                     'custrecord_lh_cp_dt_estado_busqueda': COMPROMETIDO,
                //                     'custrecord_lh_cp_dt_accion_ppto': COMPROMETIDO
                //                 }
                //             });
                //             estadoFlag = COMPROMETIDO;
                //             log.error('Record Actualizado: ', curRecord);
                //         }

                //         if (recordType == EXPENSE_REPORT) {
                //             try {
                //                 let lookupFields = search.lookupFields({ type: search.Type.EXPENSE_REPORT, id: idRecord, columns: ['advance', 'custbody_lh_amount_flag'] });
                //                 anticipo = parseFloat(lookupFields.advance);
                //                 totalAmount = parseFloat(lookupFields.custbody_lh_amount_flag);
                //                 if (anticipo.length != 0 && anticipo > 0) {
                //                     // if (parseFloat(anticipo) > 0) {
                //                     //     anticipo = anticipo / tipoCambio;
                //                     //     if (reservado <= anticipo) {
                //                     //         //! 0=5k-5k
                //                     //         calculo = anticipo - reservado;//! Pagado por completo
                //                     //         calculo = 0
                //                     //         anticipo = reservado;
                //                     //     } else {
                //                     //         //! 2k=5k-3k
                //                     //         calculo = reservado - anticipo;
                //                     //     }
                //                     // }
                //                     let result = anticipo - totalAmount;
                //                     //if (totalAmount <= anticipo) {
                //                     if (result >= 0) {
                //                         let curRecord = record.submitFields({
                //                             type: DETALLE_TRANSACCION_RECORD,
                //                             id: internalId,
                //                             values: {
                //                                 'custrecord_lh_cp_dt_reservado': 0.00,
                //                                 'custrecord_lh_cp_dt_disponible': 0.00,
                //                                 'custrecord_lh_cp_dt_pagado': reservado,
                //                                 'custrecord_lh_cp_dt_estado_busqueda': PAGADO,
                //                                 'custrecord_lh_cp_dt_accion_ppto': DIRECTO
                //                             }
                //                         });
                //                         estadoFlag = PAGADO;
                //                         log.error('Record Actualizado: ', curRecord);
                //                     } else {
                //                         let curRecord = record.submitFields({
                //                             type: DETALLE_TRANSACCION_RECORD,
                //                             id: internalId,
                //                             values: {
                //                                 'custrecord_lh_cp_dt_reservado': 0.00,
                //                                 'custrecord_lh_cp_dt_disponible': 0.00,
                //                                 'custrecord_lh_cp_dt_ejecutado': reservado,
                //                                 'custrecord_lh_cp_dt_estado_busqueda': EJECUTADO,
                //                                 'custrecord_lh_cp_dt_accion_ppto': EJECUTADO
                //                             }
                //                         });
                //                         estadoFlag = EJECUTADO;
                //                         log.error('Record Actualizado: ', curRecord);
                //                     }
                //                 } else {
                //                     let curRecord = record.submitFields({
                //                         type: DETALLE_TRANSACCION_RECORD,
                //                         id: internalId,
                //                         values: {
                //                             'custrecord_lh_cp_dt_reservado': 0.00,
                //                             'custrecord_lh_cp_dt_disponible': 0.00,
                //                             'custrecord_lh_cp_dt_ejecutado': reservado,
                //                             'custrecord_lh_cp_dt_estado_busqueda': EJECUTADO,
                //                             'custrecord_lh_cp_dt_accion_ppto': EJECUTADO
                //                         }
                //                     });
                //                     estadoFlag = EJECUTADO;
                //                     log.error('Record Actualizado: ', curRecord);
                //                 }
                //             } catch (error) {
                //                 log.error('Error-EXPENSE_REPORT', error);
                //             }
                //         }
                //     }
                // }
            }
            //var SO = record.load({ type: record.Type.SALES_ORDER, id: context.request.parameters.data,isDynamic: true });
            let lookupFields = search.lookupFields({ type: search.Type.TRANSACTION, id: idRecord, columns: ['approvalstatus', 'custbody_lh_cp_estado_ppto_oc'] });
            log.error('lookupFields', lookupFields);
            log.error('recordType', recordType);

            let statusApproval = lookupFields.approvalstatus[0].value;
            if (statusApproval == PENDING_APPROVAL) {
                if (Aprobado == 'SI') {
                    try {
                        SO = record.submitFields({
                            type: recordType,
                            id: idRecord,
                            values: {
                                'approvalstatus': TipoEstatusNuevo
                            }
                        });
                        // SO = record.load({ type: recordType, id: idRecord, isDynamic: true });
                        // SO.setValue({ fieldId: 'approvalstatus', value: TipoEstatusNuevo, ignoreFieldChange: true });
                        // let recordId = SO.save();
                        log.error('First-Approve', SO);
                        if (recordType == PURCHASE_ORDER) {
                            log.error('Task', 'Entré a taks');
                            let mapReduceScript = task.create({ taskType: task.TaskType.MAP_REDUCE });
                            mapReduceScript.scriptId = 'customscript_ts_mr_control_presupuestal';
                            mapReduceScript.deploymentId = 'customdeploy_ts_mr_control_presupuestal';
                            mapReduceScript.params = {
                                'custscript_param_purchase_order': SO,
                            };
                            let mapReduceTaskId = mapReduceScript.submit();
                            log.error('mapReduceTaskId', mapReduceTaskId);
                        }
                        
                    } catch (error) {
                      	let objRecord = record.create({ type: 'customrecord_cola_aprobacion', isDynamic: true });
                        objRecord.setValue({ fieldId: 'custrecord_orden_compra', value: SO, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custrecord_estado', value: 'Pendientes Aprobar', ignoreFieldChange: true });
                 
                        let recordId = objRecord.save({ enableSourcing: false, ignoreMandatoryFields: false });
                        log.error('Error-Aprobación', 'El registro ya está aprobado: ' + error);
                    }
                }
            }
            //~ Envío email de respuesta
            var response = Aprobado == 'NO' ? 'rechazado' : 'aprobado';
            // if (updateFlag != "4") {
            //     response = "NO Aprobado";
            // }
            var emailBody = '<p>La transacción <span style="color: #ff0000;"><a href="https://6776158-sb1.app.netsuite.com/app/accounting/transactions/purchord.nl?id=' + idRecord + '&whence=' + ' target="_blank""> ' + idRecord + '</a></span> fue ' + response + '.</p>';
            try {
                let idRecordNumber = parseInt(idRecord);
                email.send({
                    author: aprobador, //9083, // context.getValue('employee'),
                    recipients: autor,//currentRecord.getValue('custbodylh_aprobador'),    // recordType=='exprept'?context.getValue('nextapprover'):context.getValue('custbodylh_aprobador'),
                    subject: recordType == EXPENSE_REPORT ? 'Informe de Gasto' + idRecord + ' ' + response : 'Pedido ' + idRecord + ' ' + response, // 'Autorizar PEDIDO ',
                    body: emailBody, //pdfTemplate.getContents(), //emailBody, //'HOLA', //myvar,
                    relatedRecords: {
                        transactionId: idRecordNumber
                    }
                });
            } catch (error) {
                log.error('Error-Send', 'Error al envíar email de respuesta: ' + error);
            }
            var form = buildForm(context);
            context.response.writePage(form);
        }
    }

    const buildForm = (context) => {
        var fields = context.request.parameters.data.split('.');
        var recordType = fields[0];
        var idRecord = fields[1];
        var Aprobado = fields[2];
        var titulo = Aprobado == 'SI' ? 'Aprobación por EMAIL con exito' : 'Rechazado por Email con exito';
        // if (updateFlag != "4") {
        //     titulo = "NO Aprobado";
        //     Aprobado = "NO_Aprobado"
        // }
        var form = serverWidget.createForm({ title: titulo });
        var customerField = form.addField({
            id: 'custpage_customer',
            type: 'text',
            label: 'ID DEL PEDIDO'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
        // customerField.defaultValue = context.request.parameters.data
        customerField.defaultValue = recordType + '.' + idRecord + '.' + Aprobado;
        return form;
    }

    return {
        onRequest: onRequest
    };
});