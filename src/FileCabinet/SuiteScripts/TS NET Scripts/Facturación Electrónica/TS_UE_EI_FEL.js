/********************************************************************************************************************************************************
This script for E-Invoicing, Invoice, Credit Memo, Vendor Bill
/******************************************************************************************************************************************************** 
File Name: TS_UE_EI_FEL.js                                                                        
Commit: 03                                                        
Version: 1.3                                                                     
Date: 12/10/2022
ApiVersion: Script 2.x
Enviroment: PR
Governance points: N/A
========================================================================================================================================================*/


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/redirect', 'N/https', 'N/url', 'N/runtime'],

    function (record, search, redirect, https, url, runtime) {

        function beforeLoad(scriptContext) {

            try {
                var currentRecord = scriptContext.newRecord;
                var typeEvent = scriptContext.type;
                var form = scriptContext.form;
                form.clientScriptFileId = 518252;   // PRODUCCIÓN
                var subsidiaria = currentRecord.getValue('subsidiary');

                if (typeEvent === 'view') {
                    /*                     if (currentRecord.type === 'invoice') {
                                            var acceptpayment = form.getButton('acceptpayment');
                                            var plantilla = currentRecord.getValue('custbody_ts_pdf_fel_dian');
                                            if (acceptpayment != null && !plantilla && subsidiaria == 8) acceptpayment.isDisabled = true;
                                        } */

                    if (currentRecord.type === 'vendorbill') {
                        var docSoporte = currentRecord.getValue('custbody_ccs_doc_soporte');
                        if (docSoporte && subsidiaria == 8) {
                            var btnGenerarDocSoporte = form.addButton({
                                id: 'custpage_ts_gen_doc_soporte',
                                label: "Generar Documento Soporte",
                                functionName: 'generarDocumentoSoporte(' + currentRecord.id + ',"' + currentRecord.type + '")'
                            });
                            var contentPdf = currentRecord.getValue('custbody_ts_pdf_fel_dian');
                            if (contentPdf) btnGenerarDocSoporte.isDisabled = true;
                        }
                    }
                }
                if (typeEvent === 'create' || typeEvent === 'edit') {
                    if (currentRecord.type === 'creditmemo' && subsidiaria == 8) {
                        var fieldRel = form.getField('custbody_refno_originvoice');
                        fieldRel.isMandatory = true;
                    }
                }
            } catch (err) {
                log.error("Error", "[ beforeLoad ] " + err);
            }

        }

        function beforeSubmit(scriptContext) {
            var currentRecord = scriptContext.newRecord;
            var typeEvent = scriptContext.type;
            var typeRecord = currentRecord.type;
            log.debug('typeEvent', typeEvent);
            log.debug('typeRecord', typeRecord);

            var recCustomSerie = 'customrecord_co_ei_serie';
            var idCustomSerie = '1';

            try {
                log.error("INICIO beforeSubmit", "INICIO beforeSubmit");
                if (typeEvent == 'create' || typeEvent == 'edit' || typeEvent == 'copy') {
                    if (typeRecord == 'vendorbill') {
                        var doc_soporte = currentRecord.getValue('custbody_ccs_doc_soporte');
                        var doc_dian = currentRecord.getValue('custbody_co_ei_nmro_doc_dian');
                        var subsi_ds = currentRecord.getValue('subsidiary');

                        if (doc_soporte && !doc_dian && subsi_ds == 8) {
                            var correlativoDian = getSerieDian(recCustomSerie, idCustomSerie);
                            currentRecord.setValue({ fieldId: 'custbody_co_ei_nmro_doc_dian', value: correlativoDian[0], ignoreFieldChange: true });

                            record.submitFields({
                                type: recCustomSerie,
                                id: idCustomSerie,
                                values: { 'custrecord_co_inicio': correlativoDian[1] + 1 },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        }
                    }


                    if (typeRecord == 'invoice' || typeRecord == 'creditmemo') {

                        var customerId = currentRecord.getValue('entity');
                        var typeEntity = 'customer';
                        if (customerId) {

                            var idMethod = '';
                            var idTemplate = '';

                            var customerPackageEI = search.lookupFields({
                                type: typeEntity,
                                id: customerId,
                                columns: ['custentity_psg_ei_entity_edoc_standard', 'custentity_psg_ei_auto_select_temp_sm', 'subsidiary']
                            });
                            log.debug('customerPackageEI[subsidiary]', customerPackageEI['subsidiary'][0].value);

                            if (customerPackageEI['subsidiary'][0].value == '8') {
                                var idPackageEI = '';
                                log.debug('customerPackageEI[subsidiary] LEN pageInit', customerPackageEI['custentity_psg_ei_entity_edoc_standard'].length);
                                if (customerPackageEI['custentity_psg_ei_entity_edoc_standard'].length != 0) {
                                    idPackageEI = customerPackageEI['custentity_psg_ei_entity_edoc_standard'][0].value;
                                }
                                var autoPackageEI = customerPackageEI['custentity_psg_ei_auto_select_temp_sm'];
                                log.debug('idPackageEI', idPackageEI);
                                log.debug('autoPackageEI', autoPackageEI);

                                if (idPackageEI && autoPackageEI) {
                                    log.debug('hace la carga');
                                    idMethod = 105;
                                    if (typeRecord == 'invoice') idTemplate = 101;
                                    if (typeRecord == 'creditmemo') idTemplate = 102;
                                    log.debug('idTemplate', idTemplate);
                                    log.debug('idMethod', idMethod);
                                }
                            }

                            currentRecord.setValue('custbody_psg_ei_template', idTemplate);
                            currentRecord.setValue('custbody_psg_ei_sending_method', idMethod);
                        }
                    }
                }
                log.error("FIN beforeSubmit", "FIN beforeSubmit");
            } catch (err) {
                log.error("Error", "[ beforeSubmit ] " + err);
            }
        }


        function afterSubmit(scriptContext) {
            var currentRecord = scriptContext.newRecord;
            var typeEvent = scriptContext.type;
            var typeRecord = currentRecord.type;

            try {
                log.error("INICIO afterSubmit", "INICIO afterSubmit");
                if (typeEvent == 'create') {
                    if (typeRecord == 'customer') {
                        var idCustomer = currentRecord.id;
                        var recCustomerToVendor = record.transform({
                            fromType: typeRecord,
                            fromId: idCustomer,
                            toType: 'vendor',
                        });
                        recCustomerToVendor.save({ ignoreMandatoryFields: true, enableSourcing: false });
                    }
                }
                log.error("FIN afterSubmit", "FIN afterSubmit");

            } catch (err) {
                log.error("Error", "[ afterSubmit ] " + err);
            }
        }


        function getSerieDian(_recCustomSerie, _idCustomSerie) {
            try {
                var nmroDocumentoDian = search.lookupFields({
                    type: _recCustomSerie,
                    id: _idCustomSerie,
                    columns: ['custrecord_co_serie_impresion', 'custrecord_pe_digitos', 'custrecord_co_inicio', 'custrecord_co_final']
                });

                var nmroConsecutivo = Number(nmroDocumentoDian['custrecord_co_inicio']);
                var serie = nmroDocumentoDian['custrecord_co_serie_impresion'];
                var nmroDocTrans = serie + nmroConsecutivo;
                return [nmroDocTrans, nmroConsecutivo]

            } catch (e) {
                log.error("Error en getSerieDian", e);
            }

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });

/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 06/07/2022
Author: Jean Ñique
Description: Creación del script.
========================================================================================================================================================*/
/* Commit:02
Version: 1.1
Date: 25/07/2022
Author: Jean Ñique
Description: Se agregó funcionalidad para mostrar el boton de "Generar Documento Soporte".
========================================================================================================================================================*/
/* Commit:03
Version: 1.2
Date: 12/10/2022
Author: Jean Ñique
Description: Se agregó funcionalidad para relacionar automaticamente los clientes con los proveedores.
========================================================================================================================================================*/