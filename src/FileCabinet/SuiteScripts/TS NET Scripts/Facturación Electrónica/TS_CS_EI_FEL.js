/********************************************************************************************************************************************************
This script for E-Invoicing, Invoice, Credit Memo, Vendor Bill
/******************************************************************************************************************************************************** 
File Name: TS_CS_EI_FEL.js                                                                        
Commit: 03                                                
Version: 1.3                                                                   
Date: 12/10/2022
ApiVersion: Script 2.x
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/url', 'N/https', 'N/runtime'],

  function (search, url, https, runtime) {

    const TYPE_OPERATION_DEFAULT = 10

    function pageInit(scriptContext) {
      try {
        console.log('entra a pageInit');
        var currentRecord = scriptContext.currentRecord;
        var typeTransaction = currentRecord.type;
        var modo = scriptContext.mode;

        if (typeTransaction === 'invoice' || typeTransaction === 'creditmemo') {
          if (modo == 'edit' || modo == 'create' || modo == 'copy') {

            if (typeTransaction === 'creditmemo') {
              var createdFrom = currentRecord.getValue('createdfrom');
              console.log('createdFrom', createdFrom);
              if (createdFrom == undefined || createdFrom == '') {
                console.log('no tiene factura relacionada');
                var fieldRefInvoice = currentRecord.getField('custbody_refno_originvoice');
                fieldRefInvoice.isMandatory = false;
                var fieldInvoiceNoNS = currentRecord.getField('custbody_invoice_no_ns');
                fieldInvoiceNoNS.isVisible = false;
                var fieldInvoiceNoNSDate = currentRecord.getField('custbody_date_invoice_no_ns');
                fieldInvoiceNoNSDate.isVisible = false;
              }
            }


            if (modo != 'edit') {
              currentRecord.setValue('custbody_lh_co_ei_tipo_operacion', TYPE_OPERATION_DEFAULT);
              currentRecord.setValue('custbody_co_ei_nmro_doc_dian', '');
              currentRecord.setValue('custbody_ccs_cufe', '');
              currentRecord.setValue('custbody_ts_pdf_fel_dian', '');
              currentRecord.setValue('custbody_ts_fel_qr_dian', '');
            }

            // var customerId = currentRecord.getValue('entity');
            // var typeEntity = 'customer';
            // if (customerId) {

            //   var idMethod = '';
            //   var idTemplate = '';

            //   var customerPackageEI = search.lookupFields({
            //     type: typeEntity,
            //     id: customerId,
            //     columns: ['custentity_psg_ei_entity_edoc_standard', 'custentity_psg_ei_auto_select_temp_sm', 'subsidiary']
            //   });
            //   console.log('customerPackageEI[subsidiary]', customerPackageEI['subsidiary'][0].value);

            //   if (customerPackageEI['subsidiary'][0].value == '8') {
            //     var idPackageEI = '';
            //     console.log('customerPackageEI[subsidiary] LEN pageInit', customerPackageEI['custentity_psg_ei_entity_edoc_standard'].length);
            //     if (customerPackageEI['custentity_psg_ei_entity_edoc_standard'].length != 0) {
            //       idPackageEI = customerPackageEI['custentity_psg_ei_entity_edoc_standard'][0].value;
            //     }
            //     var autoPackageEI = customerPackageEI['custentity_psg_ei_auto_select_temp_sm'];
            //     console.log('idPackageEI', idPackageEI);
            //     console.log('autoPackageEI', autoPackageEI);

            //     if (idPackageEI && autoPackageEI) {
            //       console.log('hace la carga');
            //       idMethod = 105;
            //       if (typeTransaction == 'invoice') idTemplate = 101;
            //       if (typeTransaction == 'creditmemo') idTemplate = 102;
            //       console.log('idTemplate', idTemplate);
            //       console.log('idMethod', idMethod);
            //     }
            //   }
            //   currentRecord.setValue('custbody_psg_ei_template', idTemplate);
            //   currentRecord.setValue('custbody_psg_ei_sending_method', idMethod);
            // }
          }
        }


        if (typeTransaction === 'vendorbill') {
          if (modo == 'edit' || modo == 'create' || modo == 'copy') {
            if (modo == 'create') {
              typeEntity = 'vendor';
              currentRecord.setValue('custbody_co_ei_tipo_operacion_ds', 1);
            }
            if (modo != 'edit') {
              currentRecord.setValue('custbody_co_ei_nmro_doc_dian', '');
              currentRecord.setValue('custbody_ccs_cufe', '');
              currentRecord.setValue('custbody_ts_pdf_fel_dian', '');
              currentRecord.setValue('custbody_ts_fel_qr_dian', '');
            }
          }
        }


        if (typeTransaction == 'customer') {
          if (modo == 'edit') {
            var subsidiaryCustomer = currentRecord.getValue('subsidiary');
            if (subsidiaryCustomer == 8) {
              currentRecord.setValue('custentity_psg_ei_entity_edoc_standard', 102);
              currentRecord.setValue('custentity_edoc_gen_trans_pdf', true);
              currentRecord.setValue('custentity_psg_ei_auto_select_temp_sm', true);
            }
          }
        }
      } catch (error) {
        console.log('error en PageInit()', error);
      }

    }


    function fieldChanged(scriptContext) {

      try {
        var fieldName = scriptContext.fieldId;
        var currentRecord = scriptContext.currentRecord;
        var typeTransaction = currentRecord.type;

        // if (typeTransaction === 'invoice' || typeTransaction === 'creditmemo') {
        //   var customerId = currentRecord.getValue('entity');
        //   var typeEntity = 'customer';

        //   if (fieldName === 'entity') {
        //     console.log('entra a fieldChanged entity');
        //     if (customerId) {
        //       var idTemplate = '';
        //       var idMethod = '';

        //       var customerPackageEI = search.lookupFields({
        //         type: typeEntity,
        //         id: customerId,
        //         columns: ['custentity_psg_ei_entity_edoc_standard', 'custentity_psg_ei_auto_select_temp_sm', 'subsidiary']
        //       });
        //       console.log('customerPackageEI[subsidiary] fieldChanged', customerPackageEI['subsidiary'][0].value);

        //       if (customerPackageEI['subsidiary'][0].value == '8') {
        //         var idPackageEI = '';
        //         if (customerPackageEI['custentity_psg_ei_entity_edoc_standard'].length != 0) {
        //           idPackageEI = customerPackageEI['custentity_psg_ei_entity_edoc_standard'][0].value;
        //         }

        //         var autoPackageEI = customerPackageEI['custentity_psg_ei_auto_select_temp_sm'];
        //         console.log('idPackageEI', idPackageEI);
        //         console.log('autoPackageEI', autoPackageEI);

        //         if (idPackageEI && autoPackageEI) {
        //           console.log('hace la carga');
        //           idMethod = 105;
        //           if (typeTransaction == 'invoice') idTemplate = 101;
        //           if (typeTransaction == 'creditmemo') idTemplate = 102;
        //         }
        //       }
        //       currentRecord.setValue('custbody_psg_ei_template', idTemplate);
        //       currentRecord.setValue('custbody_psg_ei_sending_method', idMethod);
        //     }
        //   }
        // }


        if (typeTransaction == 'customer') {
          if (fieldName === 'subsidiary') {
            var subsidiaryCustomer = currentRecord.getValue(fieldName);
            console.log('subsidiaryCustomer', subsidiaryCustomer);
            var packageEI = '';
            var habilito = false;
            if (subsidiaryCustomer == 8) {
              packageEI = 102;
              habilito = true;
            }
            currentRecord.setValue('custentity_psg_ei_entity_edoc_standard', packageEI);
            currentRecord.setValue('custentity_edoc_gen_trans_pdf', habilito);
            currentRecord.setValue('custentity_psg_ei_auto_select_temp_sm', habilito);
          }
        }


      } catch (err) {
        console.log('error en fieldChanged()', err);

      }
    }


    function generarDocumentoSoporte(_internal_id, _type_record) {
      try {
        var flag = confirm('¿Esta seguro de generar el Documento Soporte?');
        if (flag) {

          var headerObj = { name: 'Accept-Language', value: 'en-us' };
          var urlRestletFel = url.resolveScript({
            scriptId: 'customscript_ts_rs_fel_ds',
            deploymentId: 'customdeploy_ts_rs_fel_ds',
            params: { id: _internal_id, type_rec: _type_record, user: runtime.getCurrentUser().id }
          });
          console.log('urlRestletFel', urlRestletFel);

          var response = https.get({
            url: urlRestletFel,
            headers: headerObj
          });
          console.log('response.body', response.body);

          if (response.body == 'success') {
            alert("Se creo el Documento Soporte, revise la subficha de 'Documento Electrónico'")
          } else {
            alert('Error al generar el Documento Soporte:\n' + response.body);
          }
          window.location.reload();
        }

      } catch (e) {
        console.log('Error en generarDocumentoSoporte: ', e.message);
      }
    }

    return {
      pageInit: pageInit,
      fieldChanged: fieldChanged,
      generarDocumentoSoporte: generarDocumentoSoporte
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
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:02
Version: 1.1
Date: 25/07/2022
Author: Jean Ñique
Description: Se agregó funcionalidad para implementar el boton de "Generar Documento Soporte".
========================================================================================================================================================*/
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:03
Version: 1.2
Date: 12/10/2022
Author: Jean Ñique
Description: Se agregó funcionalidad para relacionar automaticamente los clientes con los proveedores.
========================================================================================================================================================*/