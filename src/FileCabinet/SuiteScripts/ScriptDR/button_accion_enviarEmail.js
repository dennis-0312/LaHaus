/********************************************************************************************************************************************************
This script for Purchase Order, Botón => Email Aprobación
/******************************************************************************************************************************************************** 
File Name: TS_CS_CONTROL_CP_EnviarEmail.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 17/07/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/
/**
* @NApiVersion 2.1 
* @NScriptType ClientScript
*/
define(['N/email', 'N/log', 'N/record', 'N/ui/dialog', 'N/file', 'N/search', 'N/url', 'N/https'],
    (email, log, record, dialog, file, search, url, https) => {
        const PO_ITEM_LINES_SEARCH = 'customsearch_co_po_item_lines'; //CO Purchase Order Item Lines - CP PRODUCCION
        const PO_EXPENSE_LINES_SEARCH = '';
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

        function pageInit(context) {
            console.log("pageInit Triggered!");

            // return;
        }
        //exports.pageInit = pageInit;
        function AccionenviarEmail(context) {
            try {
                console.log("pageInit Triggered!");
                var fields = context.split('.');
                console.log('SPLITRecord', fields);
                var recordType = fields[0];
                var idRecord = fields[1];
                recordType = recordType == 'expensereport' ? recordType : 'purchaseorder';
                // try {
                //     if (recordType == 'purchaseorder') {
                //         record.submitFields({ type: 'purchaseorder', id: idRecord, values: { 'custbody_lh_update_flag': 4 } });
                //     }
                // } catch (error) {
                //     console.log('Error-Flag', error);
                // }

                let json2 = new Array();
                let resta = 0;
                let view_alert = 0;
                let existe_ppto = 'Tiene prespuesto';


                var campoEstado = recordType == 'expensereport' ? 'origstatus' : 'orderstatus';
                var TipoEstatus = recordType == 'expensereport' ? 'B' : 'A';
                var currentRecord = record.load({ type: recordType, id: idRecord });
                let date = currentRecord.getValue('trandate');
                date = sysDate(date); //! sysDate (FUNCTION)
                let month = date.month;
                let year = currentRecord.getValue('custbody_lh_anio_id_flag');
                let temporalidad = currentRecord.getValue('custbody_lh_temporalidad_flag');

                // let subsidiary = currentRecord.getValue('subsidiary');
                // let periodo = currentRecord.getValue({ fieldId: 'custbody_lh_cp_periodo_oc' });
                //let tipoCambio = getTipoCambio(subsidiary, periodo); //! getTipoCambio (FUNCTION)
                if (currentRecord.getValue({ fieldId: campoEstado }) != TipoEstatus) {
                    dialog.alert({
                        title: 'Atención',
                        message: 'Esta funcionalidad solo esta disponible para estatus por aprobar'
                    }).then(success).catch(failure);
                }

                //! VALIDACION PRESUPUESTAL
                // let objSearch = search.load({ id: DETALLE_TRANSACCION_SEARCH });
                // let filters = objSearch.filters;
                // const filterOne = search.createFilter({ name: 'custrecord_lh_cp_dt_purchase_ord_related', operator: search.Operator.ANYOF, values: idRecord });
                // filters.push(filterOne);

                // //let searchResultCount = objSearch.runPaged().count;
                // let result = objSearch.run().getRange({ start: 0, end: 100 });
                // console.log(result);
                // for (let i in result) {
                //     resta = 0;
                //     let category = result[i].getValue({ name: "custrecord_lh_cp_dt_category_ppto" });
                //     let reservado = parseFloat(result[i].getValue({ name: "custrecord_lh_cp_dt_reservado" }));
                //     let getCategoria = getDisponible(category, month, year, temporalidad);
                //     resta = getCategoria.disponible - reservado;
                //     if (resta < 0) {
                //         view_alert = 1;
                //         existe_ppto = 'Los siguientes centros de costo no tienen presupuesto disponible: ';
                //         json2.push(' ' + getCategoria.categoria);
                //     }
                // }

                // if (view_alert == 1) {
                //     dialog.alert({
                //         title: 'Confirmación',
                //         message: existe_ppto + json2
                //     });
                // } else if (view_alert == 0) {
                //     console.log('Se envió correo');
                //     if (currentRecord.getValue({ fieldId: campoEstado }) == TipoEstatus) {
                //         log.error('ENTRAEMAIL', 'si');
                //         ENVIAREMAIL(currentRecord);
                //         dialog.alert({
                //             title: 'Confirmación',
                //             message: 'El email ha sido enviado para su aprobación.'
                //         }).then(success).catch(failure);
                //         //location.reload();
                //     }
                // }



                console.log('Se envió correo');
                if (currentRecord.getValue({ fieldId: campoEstado }) == TipoEstatus) {
                    log.error('ENTRAEMAIL', 'si');
                    ENVIAREMAIL(currentRecord);
                    dialog.alert({
                        title: 'Confirmación',
                        message: 'El email ha sido enviado'
                    }).then(success).catch(failure);

                    //   currentRecord.setValue({fieldId:'custbody_emailenviado',value:'SI'});
                    //   currentRecord.save({ ignoreMandatoryFields: true });
                    return;
                }
            } catch (ex) {
                console.log(ex);
                console.log(JSON.stringify(ex));
                dialog.alert({
                    title: 'Alert',
                    message: 'No se pudo enviar el email, favor de validar informacion'
                }).then(success).catch(failure);
            }
        }


        //function success(result) { location.reload() }
        function success(result) { console.log('Success: ' + result) }
        function failure(reason) { console.log('Failure: ' + reason) }

        function ENVIAREMAIL(context) {
            console.log('CONTEXT:');
            console.log(context);
            var recordType = context.getValue({ fieldId: 'type' });
            var idRecord = context.getValue({ fieldId: 'id' });
            var solicitante = recordType == 'exprept' ? context.getValue('entityname') : context.getText('employee');
            var Documento = recordType == 'exprept' ? 'Reporte de Gastos' : 'Pedido';
            console.log(solicitante + solicitante);
            var myvar = '<h2 style="text-align: center;"><span style="color: #ff0000; background-color: #ffffff;">NOTIFICACIÓN</span></h2>' +
                '<p>El pedido ' + context.getValue('tranid') + '(' + context.getText('entity') + ')  acaba de ser creado se necesita su aprobacion</p>' +
                '<p> <a href="https://6776158.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=993&deploy=1&compid=6776158&h=63e10a48a343d349f44b&data=' + recordType + '.' + idRecord + '"> APROBAR</a></p>' +
                '<p> </p>';


            myvar = '<p>El siguiente documento acaba de ser creado y&nbsp; necesita su aprobacion</p>' +
                '<p>&nbsp;</p>' +
                '<table style="width: 100%; border-collapse: collapse; background-color: #e0e6ef;" border="1">' +
                '<tbody>' +
                '<tr>' +
                '<td style="width: 100%;"><span style="color: #5a6f8f;">Informacion Primaria</span></td>' +
                '</tr>' +
                '</tbody>' +
                '</table>' +
                '<table style="border-collapse: collapse; width: 99.858%; height: 108px;" border="1">' +
                '<tbody>' +
                '<tr style="height: 18px;">' +
                '<td style="width: 50%; height: 18px;"><span style="color: #808080;">DOCUMENTO</span></td>' +
                '<td style="width: 50%; height: 18px;"><span style="color: #999999;">FECHA</span></td>' +
                '</tr>' +
                '<tr style="height: 18px;">' +
                '<td style="width: 50%; height: 18px;">' + Documento + ' ' + context.getValue('tranid') + '</td>' +
                '<td style="width: 50%; height: 18px;">' + context.getValue('trandate') + '</td>' +
                '</tr>' +
                '<tr style="height: 18px;">' +
                '<td style="width: 50%; height: 18px;"><span style="color: #808080;">PROVEEDOR/EMPLEADO</span></td>' +
                '<td style="width: 50%; height: 18px;"><span style="color: #808080;">SOLICITANTE</span></td>' +
                '</tr>' +
                '<tr style="height: 18px;">' +
                '<td style="width: 50%; height: 18px;">' + context.getValue('entityname') + '</td>' +
                '<td style="width: 50%; height: 18px;">' + solicitante + '</td>' +
                '</tr>' +
                '</tbody>' +
                '</table>' +
                '<tr>' +
                '<td style="width: 100%;"><strong><span style="color: #ffffff;">Items</span></strong></td>' +
                '</tr>' +
                '</tbody>' +
                '</table>' +
                '<table style="width: 100%; border-collapse: collapse; background-color: #607799;" border="1">' +
                '<tbody>' +
                '<tr>' +
                '<td style="width: 100%;"><strong><span style="color: #ffffff;">Items</span></strong></td>' +
                '</tr>' +
                '</tbody>' +
                '</table>' +
                '<table style="width: 100%; border-collapse: collapse; background-color: #e5e5e5;" border="1">' +
                '<tbody>' +
                '<tr>' +
                '<td style="width: 25%;">ARTICULO</td>' +
                '<td style="width: 25%;">QUANTITY</td>' +
                '<td style="width: 25%;">RATE</td>' +
                '<td style="width: 25%;">AMOUNT</td>' +
                '</tr>' +
                '</tbody>' +
                '</table>';

            //AQUI SE INGRESA EL DETALLE 
            if (recordType != 'exprept') {
                var tamaño = context.getLineCount({ sublistId: 'item' });

                for (var i = 0; i < tamaño; i++) {
                    var rateFix = context.getSublistText({ sublistId: 'item', line: i, fieldId: 'rate' });
                    rateFix = Number.parseFloat(rateFix).toFixed(2);
                    var linea = '<table style="border-collapse: collapse; width: 100%;" border="1">' +
                        '<tbody>' +
                        '<tr>' +
                        '<td style="width: 25%;">' + context.getSublistText({ sublistId: 'item', line: i, fieldId: 'item' }) + '</td>' +
                        '<td style="width: 25%;">' + context.getSublistText({ sublistId: 'item', line: i, fieldId: 'quantity' }) + '</td>' +
                        '<td style="width: 25%;">$' + rateFix + '</td>' +
                        '<td style="width: 25%;">$' + context.getSublistText({ sublistId: 'item', line: i, fieldId: 'amount' }) + '</td>' +
                        '</tr>' +
                        '</tbody>' +
                        '</table>';

                    myvar = myvar + linea;

                }
            }
            else {
                var tamaño = context.getLineCount({ sublistId: 'expense' });
                console.log('tamaño exprept' + tamaño);
                for (var i = 0; i < tamaño; i++) {
                    var linea2 = '<table style="border-collapse: collapse; width: 100%;" border="1">' +
                        '<tbody>' +
                        '<tr>' +
                        '<td style="width: 25%;">' + context.getSublistText({ sublistId: 'expense', line: i, fieldId: 'category' }) + '</td>' +
                        '<td style="width: 25%;">' + context.getSublistText({ sublistId: 'expense', line: i, fieldId: 'quantity' }) + '</td>' +
                        '<td style="width: 25%;">$' + context.getSublistText({ sublistId: 'expense', line: i, fieldId: 'exchangerate' }) + '</td>' +
                        '<td style="width: 25%;">$' + context.getSublistText({ sublistId: 'expense', line: i, fieldId: 'amount' }) + '</td>' +
                        '</tr>' +
                        '</tbody>' +
                        '</table>';
                    console.log(linea2);

                    myvar = myvar + linea2;

                }


            }
            var bodyFooter = '<p>&nbsp;</p>' +
                '<p>&nbsp;</p>' +
                '<p>&nbsp;</p>' +
                '<table style="height: 27px; width: 50.0001%; border-collapse: collapse; background-color: #607799;" border="1">' +
                '<tbody>' +
                '<tr>' +
                '<td style="width: 100%;"><span style="color: #ffffff;">RESUMEN</span></td>' +
                '</tr>' +
                '</tbody>' +
                '</table>' +
                '<table style="height: 26px; width: 50%; border-collapse: collapse; background-color: #e0e6ef;" border="1">' +
                '<tbody>' +
                '<tr>' +
                '<td style="width: 100%;">TOTAL&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<strong><span style="color: #36302a;">$' + context.getValue('total') + '</span></strong></td>' +
                '</tr>' +
                '</tbody>' +
                '</table>' +
                '<p>&nbsp;</p>' +
                '<p>&nbsp;</p>' +
                '<p> <a href="https://6776158.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=993&deploy=1&compid=6776158&h=63e10a48a343d349f44b&data=' + recordType + '.' + idRecord + '.SI' + '"> APROBAR</a></p>' +
                '&nbsp; &nbsp; &nbsp; &nbsp;  &nbsp;' + '<p> <span style="color: #ff0000;"> <a style="color: #ff0000;" href="https://6776158.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=993&deploy=1&compid=6776158&h=63e10a48a343d349f44b&data=' + recordType + '.' + idRecord + '.NO' + '"> RECHAZAR</a></p>' +
                '<p> </p>';
            myvar = myvar + bodyFooter;
            var adjuntos = [];
            console.log('ANTES DE CARGAR');
            // var myFile = file.load('SuiteScripts/ScriptDR/pagoDR.pdf');
            console.log('SI CARGA EL ARCHVO');

            /*    var mergeResult = render.mergeEmail({
                    templateId: 103,
                    entity: null,
                    recipient: null,
                    supportCaseId: null, 
                    transactionId: 80810,
                    customRecord: null
                });
                var emailBody = mergeResult.body
      */

            //AgregarAdjuntos(recordType,idRecord);
            /*    var autor=recordType=='exprept'?context.getValue('entity'):context.getValue('employee');
              email.send({
                  author:autor, //9083, // context.getValue('employee'),
                  recipients: context.getValue('custbodylh_aprobador'),    // recordType=='exprept'?context.getValue('nextapprover'):context.getValue('custbodylh_aprobador'),
                  subject: recordType=='exprept'?'Autorizar Informe de Gastos':'Autorizar Pedido', // 'Autorizar PEDIDO ',
                  body:  myvar,
                 attachments:[archivo], //adjuntos,
                  relatedRecords: {
                    transactionId: context.getValue('id')
                }
                  });
                  console.log("Si envia el correo");*/

            console.log('Antes de Entrar al url');


            var suiteletURL = url.resolveScript({
                //!SB
                //scriptId: 'customscript_dr_suitelet_createmail',
                //!PR
                scriptId: 'customscriptdr_suitelet_crearemail',
                deploymentId: 'customdeploy_dr_suitelet_crearemail',
                returnExternalUrl: false,
                params: {
                    'data': recordType + '.' + idRecord,
                }
            });
            console.log('Antes de Entrar  de obtener get');
            var response = https.get({ url: suiteletURL, body: '' });
            console.log('Termina get');
        }


        function AgregarAdjuntos(recordType, idRecord) {
            var attachID = [];
            console.log("Si entra al adjunto");
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["internalid", "anyof", idRecord],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            join: "file",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "name",
                            join: "file",
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "documentsize",
                            join: "file",
                            label: "Size (KB)"
                        })
                    ]
            });
            var contar = transactionSearchObj.runPaged().count;
            //   log.debug("transactionSearchObj result count",searchResultCount);
            var resultados = transactionSearchObj.runPaged({
                pageSize: 1000
            });

            var k = 0;
            resultados.pageRanges.forEach(function (pageRange) {
                var pagina = resultados.fetch({ index: pageRange.index });
                pagina.data.forEach(function (r) {
                    k++
                    attachID.push(r.getValue({ name: "internalid", join: "file" }));
                    console.log("ID INTERNO DE  ARCHIVO");
                    console.log(r.getValue({ name: "internalid", join: "file" }));
                });
            });
            var attachfiles = [];
            for (var i = 0; i < attachID.length; i++) {
                attachfiles.push(file.load({ id: attachID[i] }));
            }

            return attachfiles;
        }


        const getDisponible = (category, month, year, temporalidad) => {
            let disponible = 0;
            let arregloTrimestre = 0;
            let suma = 0.0;
            try {
                let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
                let filters = objSearch.filters;
                const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
                filters.push(filterOne);
                const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: DISPONIBLE });
                filters.push(filterTwo);
                const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
                filters.push(filterThree);

                let searchResultCount = objSearch.runPaged().count;
                if (searchResultCount != 0) {
                    let result = objSearch.run().getRange({ start: 0, end: 1 });
                    let categoria = result[0].getText({ name: "custrecord_lh_cp_centro_costo", join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA" });

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

                    return {
                        disponible: disponible,
                        categoria: categoria
                    }
                } else {
                    return 0;
                }
            } catch (error) {
                console.log(error);
            }
        }


        const sysDate = (date_param) => {
            try {
                let date = new Date(date_param);
                let month = date.getMonth() + 1; // jan = 0
                let year = date.getFullYear();
                month = month < 9 ? '0' + month : month;
                return {
                    month: month,
                    year: year
                }
            } catch (e) {
                log.error('Error-sysDate', e);
            }
        }


        return {
            pageInit: pageInit,
            AccionenviarEmail: AccionenviarEmail
        }

        // exports.AccionenviarEmail = AccionenviarEmail;
        // return exports;
    });