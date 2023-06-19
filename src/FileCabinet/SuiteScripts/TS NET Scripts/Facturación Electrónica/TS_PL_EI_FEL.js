/********************************************************************************************************************************************************
This script for E-Invoicing, Invoice, Credit Memo
/******************************************************************************************************************************************************** 
File Name: TS_PL_EI_FEL.js                                                                        
Commit: 09                                                        
Version: 1.8                                                                    
Date: 14/10/2022
ApiVersion: Script 2.x
Enviroment: PR
Governance points: N/A
========================================================================================================================================================*/

/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 */
define(["N/record", "N/file", "N/email", "N/encode", "N/search", "N/https", "N/log", 'N/runtime'],
    function (record, file, email, encode, search, https, log, runtime) {
        var TYPE_TRANSACTION = '';
        var ID_TRANSACTION = '';
        var USER_ID = '';
        var MY_SUBSIDIARY = 8;
        var FOLDER_FILES = 4433;

        var result = {
            success: true,
            message: "Success",
        };

        function send(plugInContext) {
            try {

                ID_TRANSACTION = plugInContext.transaction.id;
                USER_ID = plugInContext.sender.id;

                var typeRef = search.lookupFields({
                    type: 'transaction',
                    id: ID_TRANSACTION,
                    columns: ['recordtype']
                });
                TYPE_TRANSACTION = typeRef['recordtype'];


                var searchOptions = { start: 0, end: 10 }
                var _searchEmployee = search.load({ id: 'customsearch_col_e_invoicing' })

                //Add Filters
                if (ID_TRANSACTION) {
                    _searchEmployee.filters.push(search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: [ID_TRANSACTION]
                    }))
                }
                var employeeResult = searchToJson(_searchEmployee, searchOptions);


                // CARGAR INFORMACIÓN DE LA TRANSACCIÓN
                var rec = record.load({ type: TYPE_TRANSACTION, id: ID_TRANSACTION });

                // FORMATO DE LA FECHA Y HORA
                var dateTimeFel = (employeeResult[0]['date_created']).split(' ');
                var timeFel = formatHour(dateTimeFel[1], dateTimeFel[2]) + ":00";
                var dateFormated = formatDate(dateTimeFel[0]);
                var dateFormated2 = formatDate(rec.getText('trandate'));


                // DOCUMENTO RELACIONADO
                var nmroOrdenRel = null;
                var dateOrdenRel = null;

                var docType = '';
                var typeNdNc = '';
                var tipoDocumento = '';
                var nameDoc = '';
                var noDocNs = false;
                var nmroDocRel = '';
                var dateFormatedRel = '';

                if (employeeResult[0]['document_type'] == 'invoice') {

                    docType = 'FVN';
                    typeNdNc = null;
                    tipoDocumento = '01';
                    nameDoc = 'FACTURA';
                    dueDocument = formatDate(employeeResult[0]['due_date_document']);
                    nmroOrdenRel = employeeResult[0]['creado_desde'];
                    if (nmroOrdenRel) dateOrdenRel = formatDate(((employeeResult[0]['creado_desde_date']).split(' '))[0]);

                } else if (employeeResult[0]['document_type'] == 'creditmemo') {

                    docType = 'NC';
                    typeNdNc = employeeResult[0]['tipo_nc'];
                    tipoDocumento = '91';
                    nameDoc = 'NOTA DE CRÉDITO';
                    dueDocument = dateFormated2;
                    nmroDocRel = rec.getText('custbody_refno_originvoice');
                    dateFormatedRel = formatDate(busqDocumentRelated(nmroDocRel)['dateDocRel']);
                    noDocNs = rec.getValue('custbody_invoice_no_ns');
                    if (noDocNs) dateFormatedRel = formatDate(rec.getText('custbody_date_invoice_no_ns'));

                }

                var operationType = (rec.getText('custbody_lh_co_ei_tipo_operacion')).substring(0, 2);

                var nmroDocTrans = employeeResult[0]['document_number'];
                var documentHead = {
                    "documentType": docType, // como diferencio las distintas Facturas (Nacional, de Exportacion) (identifica el tipo de documento a procesar)
                    "type": typeNdNc,       // tipo de nota crédito o débito
                    "documentNumber": nmroDocTrans,
                    "dateCreated": dateFormated2,
                    "timeCreated": timeFel,
                    "opetarionType": operationType,      // Tipo de operación del documento generado (Por defecto es 10)
                    "refererOrder": nmroOrdenRel || null,       // hay documentos relacionados
                    "dateRefererOrder": dateOrdenRel,   // hay fecha para los documentos relacionados
                    "dueDateDocument": dueDocument
                }

                //var cufeRec = rec.getValue('custbody_ccs_cufe');
                var subsidiaria = rec.getValue('subsidiary');
                var cityEmisor = getZipCityAddress('subsidiary', subsidiaria)['cityEmisor'];

                var postalCodeEmisor = '';
                var nameCityEmi = '';
                if (cityEmisor) {
                    postalCodeEmisor = getCiudadMuni(cityEmisor)['codigoDane'];
                    nameCityEmi = getCiudadMuni(cityEmisor)['nombreCiudad'];
                }

                var nmroIdSubsidiaria = employeeResult[0]['identification_number_emi'];
                var tipoIdSubsidiaria = "31";
                var direccionEmisor = employeeResult[0]['address_emi'];
                if (direccionEmisor) direccionEmisor = direccionEmisor.replace(/(\r\n|\n|\r|\t)/gm, " ");

                var documentEmisor = {
                    "identificationType": tipoIdSubsidiaria,    // No hay el campo Tipo de identificación del emisor, por defecto se toma 31
                    "identificationNumber": nmroIdSubsidiaria, // (ID o NIT del Emisor)
                    "emisorName": employeeResult[0]['emisor_name_emi'],
                    "state": employeeResult[0]['state_emi'],
                    "city": nameCityEmi || employeeResult[0]['city_emi'],
                    "address": direccionEmisor,
                    "country": employeeResult[0]['country_emi'] || 'CO',
                    "countryName": employeeResult[0]['country_name_emi'] || 'Colombia',
                    "cityCode": postalCodeEmisor,       // cual puede ser el codigo postal de la subsidiaria
                    "legalOrganization": "1",   // Se toma el valor de 1 por ser persona juridica
                    "regime": "48",            // buscar  Tipo de régimen correspondiente al emisor
                    "postalCode": getZipCityAddress('subsidiary', subsidiaria)['zipCode'] || "000000",     // Código postal de la dirección del emisor.
                    "businessActivity": "6820", //Corresponde al código de actividad económica CIIU
                    "rutObligations": "O-13",    // Obligaciones del contribuyente O-06;O-07
                    "taxesDetails": "01",       // Detalles tributarios del emisor
                    "merchantNumber": null      // Número de matrícula mercantil
                }


                var recIdType = search.lookupFields({
                    type: 'customrecord_ccs_tipo_de_identificacion',
                    id: employeeResult[0]['identification_type_rec'],
                    columns: ['custrecord_ccs_codigo_dane']
                })

                var rutObligations = employeeResult[0]['rut_obligations_rec'];
                var arrayRutObligations = rutObligations.split(' ');
                var arrayTaxes = (employeeResult[0]['taxes_details_rec']).split(',');
                var customer = rec.getValue('entity');
                var nameReceptor = employeeResult[0]['legal_organization_rec'] == '1' ? employeeResult[0]['receptor_name'] : employeeResult[0]['receptor_name_indv'];
                var direccionReceptor = employeeResult[0]['address_rec'];
                if (direccionReceptor) direccionReceptor = direccionReceptor.replace(/(\r\n|\n|\r|\t)/gm, " ");

                var documentReceptor = {
                    "identificationType": recIdType['custrecord_ccs_codigo_dane'],
                    "identificationNumber": employeeResult[0]['identification_number_rec'],
                    //"receptorName": employeeResult[0]['receptor_name'],
                    "receptorName": nameReceptor,
                    "legalOrganization": employeeResult[0]['legal_organization_rec'],
                    "state": employeeResult[0]['state_rec'],
                    "cityCode": employeeResult[0]['codigo_city_rec'],
                    "city": employeeResult[0]['city_rec'],
                    "address": direccionReceptor,
                    "countryName": employeeResult[0]['country_name_rec'] || 'Colombia',
                    "country": employeeResult[0]['country_rec'] || 'CO',
                    "regime": (employeeResult[0]['tipo_regimen_rec']).substring(0, 2),     //Tipo de régimen correspondiente al receptor
                    "email": employeeResult[0]['email_rec'],
                    "phone": employeeResult[0]['phone_rec'],
                    "postalCode": getZipCityAddress('customer', customer)['zipCode'] || "000000",     //Código postal de la dirección del receptor
                    "rutObligations": arrayRutObligations[0], //custentityccs_responsabilidad_ (RESPONSABILIDAD FISCAL)
                    "taxesDetails": (arrayTaxes[0]).substring(0, 2),  // Detalles tributarios del receptor
                    "personAuthIdType": nmroIdSubsidiaria,     //Identificación de la persona autorizada para descargar documentos
                    "personAuth": tipoIdSubsidiaria           // Tipo de identificación del Autorizado para descargar
                }


                // FACTURACIÓN INVOICE
                var documentItems = [];
                var discountsTotals = [];


                var arrayMedioPago = (employeeResult[0]['medio_pago']).split('-');
                var payReference = {
                    "mainPay": arrayMedioPago[0],         // Medio de Pago
                    "dueDate": dueDocument,
                    "method": employeeResult[0]['metodo_pago'],          // Metodo de Pago
                    "payNumber": arrayMedioPago[1]
                }

                var aditionalInformation = [{
                    "key": nameDoc + " NETSUITE",
                    "value": employeeResult[0]['document_number']
                },
                {
                    "key": "NOTA",
                    "value": employeeResult[0]['memo'] || '--'
                },
                {
                    "key": "CUENTA BANCARIA",
                    "value": rec.getText('custbodylh_cuenta_bancaria') || '--'
                },
                {
                    "key": "OBSERVACIONES",
                    "value": rec.getText('custbodylh_observaciones') || '--'
                }
                ]

                // ------------------------ GENERACIÓN DE LA TRAMA A NIVEL DE LINEA DE LA TRANSACCIÓN -------------------------------------- //

                // Para evaluar el tipo de retenciones
                var sumaSubtotal = 0.00;
                var sumaTaxable = 0.00;
                var sumaTaxes = 0.00;
                var sumaDescuentos = 0.00;
                var lineTransaction = rec.getLineCount('item');
                for (var i = 0; i < lineTransaction; i++) {
                    var typeItem = rec.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i });
                    var iswht = rec.getSublistValue({ sublistId: "item", fieldId: "custcol_4601_witaxapplies", line: i });
                    //var docstatu = 'Línea: ' + i + ' - item: ' + rec.getSublistValue({ sublistId: "item", fieldId: "description", line: i })     
                    // var scriptObj = runtime.getCurrentScript();
                    // var dosRes = 'Línea: ' + i + '- Con retención: ' + scriptObj.getRemainingUsage();
                    // logStatus(ID_TRANSACTION, dosRes);
                    if (typeItem !== 'Discount') {
                        var nameItem = rec.getSublistValue({ sublistId: "item", fieldId: "description", line: i }) || "-";
                        var nameProject = rec.getSublistText({ sublistId: "item", fieldId: "job_display", line: i }) || "-";
                        var unityPrice = rec.getSublistValue({ sublistId: "item", fieldId: "rate", line: i })
                        if (typeItem === 'Service') {
                            unityPrice = rec.getSublistValue({ sublistId: "item", fieldId: "rate", line: i }) || rec.getSublistValue({ sublistId: "item", fieldId: "amount", line: i });
                        }

                        var detailsItem = {
                            "code": rec.getSublistValue({ sublistId: "item", fieldId: "item", line: i }),
                            "name": (nameItem.replace(/(\r\n|\n|\r|\t)/gm, "")).replace(/\//g, '-') + '/' + nameProject,
                            "quantity": rec.getSublistValue({ sublistId: "item", fieldId: "quantity", line: i }) || 1,
                            "quantityPerBox": rec.getSublistValue({ sublistId: "item", fieldId: "quantity", line: i }) || 1,
                            "measureCode": "94",
                            "priceTypeCode": "03",
                            "unityPrice": Number(unityPrice).toFixed(2),
                            "total": rec.getSublistValue({ sublistId: "item", fieldId: "amount", line: i }),
                            "discount": "0.00",
                            "nonCommercialValue": "0.00",
                            "description": (rec.getSublistValue({ sublistId: "item", fieldId: "description", line: i })).replace(/(\r\n|\n|\r|\t)/gm, ""),
                            "mandanteTypeID": tipoIdSubsidiaria,
                            "mandanteNumberID": nmroIdSubsidiaria,
                            "mark": null,
                            "model": null,
                            "taxes": [{
                                "type": busquedaTaxCodeDIAN(rec.getSublistValue({ sublistId: "item", fieldId: "taxcode", line: i })),
                                "percentage": rec.getSublistValue({ sublistId: "item", fieldId: "taxrate1", line: i }),
                                "taxable": rec.getSublistValue({ sublistId: "item", fieldId: "amount", line: i }),
                                "tax": rec.getSublistValue({ sublistId: "item", fieldId: "tax1amt", line: i })
                            }]
                        }

                        var typeItem2 = rec.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i + 1 });
                        var iswhtTaxItem = rec.getSublistValue({ sublistId: "item", fieldId: "custcol_4601_witaxline", line: i + 1 }) || false;

                        if (typeItem2 === 'Discount' && !iswhtTaxItem) {
                            var percentDesc = Number(rec.getSublistValue({ sublistId: "item", fieldId: "rate", line: i + 1 }) * (-1)).toFixed(2);
                            var baseDesc = Number(detailsItem["total"]).toFixed(2);
                            var totalDesc = Number(baseDesc * percentDesc * 0.01).toFixed(2);
                            detailsItem["discounts"] = [{
                                "description": rec.getSublistValue({ sublistId: "item", fieldId: "description", line: i + 1 }),
                                "percentage": percentDesc,
                                "base": baseDesc,
                                "total": totalDesc
                            }]
                            detailsItem["discount"] = Number(totalDesc).toFixed(2);
                            detailsItem["total"] = Number(baseDesc - totalDesc).toFixed(2);
                            detailsItem["taxes"][0]["tax"] = Number(detailsItem["total"] * detailsItem["taxes"][0]["percentage"] * 0.01).toFixed(2);
                            detailsItem["taxes"][0]["taxable"] = Number(detailsItem["total"]).toFixed(2);
                            //sumaDescuentos += Number(detailsItem["discount"]);
                        }

                        if (iswht) {
                            var whtTaxCode = Number(rec.getSublistValue({ sublistId: "item", fieldId: "custcol_4601_witaxcode", line: i }));
                            var amountWhtTax = detailsItem["total"];
                            var tasaRetencion = busquedaTipoRetencion(whtTaxCode);

                            for (var ele in tasaRetencion) {
                                var whtcode = "";
                                if (tasaRetencion[ele]["nombre_retencion"] == 'RTFUE') {
                                    whtcode = '06';
                                } else if (tasaRetencion[ele]["nombre_retencion"] == 'RTICA') {
                                    whtcode = '07';
                                } else if (tasaRetencion[ele]["nombre_retencion"] == 'RTIVA') {
                                    whtcode = '05';
                                    amountWhtTax = detailsItem["taxes"][0]["tax"];
                                } else {
                                    logError(ID_TRANSACTION, USER_ID, "Error en el nombre de la retención", subsidiaria, "El nombre de la rentención debe iniciar con RTFUE, RTICA y RTIVA");
                                    return false;
                                }

                                detailsItem["taxes"].push({
                                    "type": whtcode,
                                    "percentage": Number(tasaRetencion[ele]["tasa_retencion"] * 100).toFixed(2) || "0.00",
                                    "taxable": Number(amountWhtTax).toFixed(2),
                                    "tax": Number(amountWhtTax * tasaRetencion[ele]["tasa_retencion"]).toFixed(2)
                                });
                            }
                        }

                        sumaSubtotal += Number(detailsItem["total"]);
                        sumaTaxable += Number(detailsItem["taxes"][0]["taxable"]);
                        sumaTaxes += Number(detailsItem["taxes"][0]["tax"]);
                        documentItems.push(detailsItem);
                    }
                }

                var documentTotal = {
                    "subtotal": Number(sumaSubtotal).toFixed(2),
                    "taxable": Number(sumaTaxable).toFixed(2),
                    "taxes": Number(sumaTaxes).toFixed(2),
                    "discount": Number(sumaDescuentos).toFixed(2),
                    "charges": "0.00",
                    "prePaid": "0.00",
                    "totalPay": Number(Number(sumaSubtotal) + Number(sumaTaxes) - Number(sumaDescuentos)).toFixed(2),
                    "coin": rec.getText('currency')
                }


                // AGREGANDO INFORMACIÓN DE ACUERDO AL TIPO DE TRANSACTION
                if (TYPE_TRANSACTION != 'invoice') {
                    // SOLO PARA NC Y ND
                    var invoiceNumberRel = nmroDocRel;
                    var invoiceDateRel = dateFormatedRel;
                    var descriptionRel = employeeResult[0]['name_tipo_nc'];

                    //if (!rec.getValue('custbody_refno_originvoice')) {
                    if (nmroDocRel == 'NULL' || nmroDocRel == 'null') {
                        invoiceNumberRel = nmroDocRel;
                        invoiceDateRel = dateFormated2;
                        descriptionRel = nmroDocRel;
                    }

                    var billingReference = {
                        "invoiceNumber": invoiceNumberRel,
                        "invoiceDate": invoiceDateRel,
                        "description": descriptionRel
                    }
                }


                // JSON QUE ENVIA PARA FACTURAR
                var jsonFacturador = {
                    "documents": [{
                        "documentHead": documentHead,
                        "documentEmisor": documentEmisor,
                        "documentReceptor": documentReceptor,
                        "discountsTotals": discountsTotals,
                        "documentTotal": documentTotal,
                        "documentItems": documentItems,
                        "billingReference": billingReference,
                        "payReference": payReference,
                        "aditionalInformation": aditionalInformation
                    }]
                }

                var pdfDian = {
                    "nit": documentEmisor["identificationNumber"],
                    "tipo_documento": tipoDocumento,
                    "numeral": nmroDocTrans
                }

                var rpta = sendDocument(jsonFacturador);
                var resPdfDian = getPdfDian(pdfDian);

                if (rpta['estado'] == "2") {

                    rec.setValue('custbody_co_ei_nmro_doc_dian', nmroDocTrans);
                    rec.setValue('custbody_ccs_cufe', rpta['cufe']);
                    rec.setValue('custbody_ts_pdf_fel_dian', resPdfDian['pdf']);
                    rec.setValue('custbody_ts_fel_qr_dian', resPdfDian['qrcode']);
                    logStatus(ID_TRANSACTION, rpta['message']);

                } else {
                    var error = rpta['estado'] == "3" ? rpta['error_detail'] : rpta['sintaxError'];
                    logError(ID_TRANSACTION, USER_ID, "Error al enviar trama a la DIAN", subsidiaria, error);
                    if (rpta['estado'] == "3") logStatus(ID_TRANSACTION, rpta['message']);
                    return false;
                }

                rec.save({ ignoreMandatoryFields: true, enableSourcing: false });

            } catch (error) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, TYPE_TRANSACTION, subsidiaria, JSON.stringify(error));
            }
            return result;
        }


        // CONVIERTE A LA FECHA EN FORMATO YYYY-MM-DD
        function formatDate(dateString) {
            try {
                var date = dateString.split('/');
                if (Number(date[0]) < 10) date[0] = '0' + Number(date[0]);
                if (Number(date[1]) < 10) date[1] = '0' + Number(date[1]);
                return date[2] + '-' + date[1] + '-' + date[0];

            } catch (e) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Error en el formato Fecha", MY_SUBSIDIARY, "Revisar que la fecha tenga formato DD/MM/YYYY");
                return false;
            }
        }


        // Obtener Nombre o Código DANE de la ciudad/municipio
        function getCiudadMuni(_id_city) {
            try {
                var _loadCity = search.lookupFields({
                    type: 'customrecord_ccs_lista_ciudades_2',
                    id: _id_city,
                    columns: ['name', 'custrecord3_2']
                });
                return {
                    "nombreCiudad": _loadCity['name'],
                    "codigoDane": _loadCity['custrecord3_2']
                }

            } catch (e) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Error en la obtención del código DANE", MY_SUBSIDIARY, "No se encontró el código DANE para la ciudad/municipio");
                return false;
            }
        }


        // obtener ciudad y código postal de la dirección de la entidad
        function getZipCityAddress(_type_entity, _id_entity) {
            try {
                var idzip = _type_entity == 'subsidiary' ? "zip" : "zipcode";
                var busqCityEmisor = search.create({
                    type: _type_entity,
                    filters: [
                        ["internalid", "anyof", _id_entity]
                    ],
                    columns: [
                        search.createColumn({
                            name: idzip,
                            join: "address"
                        }),
                        search.createColumn({
                            name: "custrecord_ccs_ciudad",
                            join: "address"
                        })
                    ]
                });
                var searchResult = busqCityEmisor.run().getRange({ start: 0, end: 1 });
                var zipCode = '';
                var cityEmisor = '';
                if (searchResult.length != 0) {
                    zipCode = searchResult[0].getValue(busqCityEmisor.columns[0]);
                    cityEmisor = searchResult[0].getValue(busqCityEmisor.columns[1]);
                }
                return {
                    "zipCode": zipCode,
                    "cityEmisor": cityEmisor
                }

            } catch (e) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Error en la obtención del código postal", MY_SUBSIDIARY, "Error al obtener ciudad y código postal de la dirección de la entidad");
                return false;
            }
        }


        // FUNCIÓN QUE ENVIA EL DOCUMENTO A LA DIAN
        function sendDocument(_object) {
            try {
                var credencialEnvio = getCredenciales(1); // 1: id de envio de factura
                var headers = new Array();
                headers['Authorization'] = credencialEnvio["password"];
                headers['Content-Type'] = credencialEnvio["content_type"];

                var url = credencialEnvio["url_ws"];
                var req = JSON.stringify(_object);

                var myresponse = https.post({
                    url: url,
                    headers: headers,
                    body: req
                });

                var bodyRes = JSON.parse(myresponse.body);
                var mensajeRes = bodyRes.response[0].message;

                return {
                    estado: mensajeRes['estado'],
                    error_detail: mensajeRes['error_detail'],
                    sintaxError: bodyRes.response[0]['sintaxError'],
                    message: mensajeRes['message'],
                    cufe: mensajeRes['cufe'],
                    pdf: mensajeRes['pdf'],
                }

            } catch (e) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Error al enviar el documento a ESTUPENDO", MY_SUBSIDIARY, "Error en la respuesta del API de ESTUPENDO al enviar el documento. Detalle: " + e.message);
                return false;
            }
        }


        // FUNCION PARA OBTENER EL PDF DE LA DIAN
        function getPdfDian(_object) {
            try {
                var credencialConsulta = getCredenciales(2); // 2: id de Consulta la factura
                var headers = new Array();
                headers['Authorization'] = credencialConsulta["password"];
                headers['Content-Type'] = credencialConsulta["content_type"];

                var url = credencialConsulta["url_ws"];
                var req = JSON.stringify(_object);

                var myresponse = https.post({
                    url: url,
                    headers: headers,
                    body: req
                });

                var bodyRes = JSON.parse(myresponse.body);
                return {
                    "message": bodyRes["message"],
                    "cufe": bodyRes["cufe"],
                    "pdf": bodyRes["pdf"],
                    "qrcode": bodyRes["qrcode"]
                }

            } catch (e) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Error al consultar el estado del documento", MY_SUBSIDIARY, "Error en la respuesta del API de ESTUPENDO que consulta el estado del documento emitido. Detalle: " + e.message);
                return false;
            }
        }


        // GUARDA LOS ARCHIVOS EN EL FILE CABINET
        function getFileJSON(_name, content) {
            try {
                var fileObj = file.create({
                    name: 'FEL_' + _name + '.json',
                    fileType: file.Type.JSON,
                    contents: JSON.stringify(content),
                    folder: FOLDER_FILES
                });
                var fileid = fileObj.save();
                return fileid;

            } catch (e) {

            }
        }


        // RETORNA EL PDF DEL FILE CABINET
        function getFilePDF(_name, _url) {
            try {
                // Request the PDF
                var pdfResp = https.get({ url: _url });
                // Save the PDF to File Cabinet
                var pdfFileObj = file.create({
                    name: 'FEL_' + _name + '.pdf',
                    fileType: file.Type.PDF,
                    contents: pdfResp.body,
                    folder: FOLDER_FILES,
                });
                var createdFileId = pdfFileObj.save();
                return createdFileId;

            } catch (e) {

            }

        }


        // BUSQUEDA DE RETENCIONES INDIVIDUAL O GRUPAL
        function busquedaTipoRetencion(_id_retencion) {
            try {
                var arrayRetenciones = [];
                var searchOptions = { start: 0, end: 10 }
                var _searchTaxesWht = search.load({ id: 'customsearch_tax_code_retencion' })

                //Add Filters
                if (_id_retencion) {
                    _searchTaxesWht.filters.push(search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: [_id_retencion]
                    }))
                }
                var taxesWhtResult = searchToJson(_searchTaxesWht, searchOptions);
                for (var e in taxesWhtResult) {
                    var es_grupo_ret = taxesWhtResult[e]['es_grupo_retencion']
                    if (es_grupo_ret) {
                        var getRetenciones = tasaImpuestoRetencion(taxesWhtResult[e]['id_impuesto_agrupado']);
                        arrayRetenciones.push(getRetenciones);
                    } else {
                        arrayRetenciones.push({
                            "tipo_retencion": taxesWhtResult[e]['tipo_retencion'],
                            "tasa_retencion": taxesWhtResult[e]['tasa'],
                            "nombre_retencion": ((taxesWhtResult[e]['name_retencion']).substring(0, 5)).toUpperCase()
                        })
                    }
                }
                return arrayRetenciones;

            } catch (e) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Error en la búsqueda de retenciones", MY_SUBSIDIARY, "Error en la búsqueda de retenciones a nivel individual o grupal");
                return false;
            }
        }


        //BUSQUEDA DE RETENCIONES SI PERTENECEN A UN GRUPO
        function tasaImpuestoRetencion(id_agrupado) {
            try {
                var busqTipoTasaRet = search.create({
                    type: "customrecord_4601_groupedwitaxcode",
                    filters: [["internalid", "anyof", id_agrupado]],
                    columns:
                        [
                            "custrecord_4601_gwtc_code",
                            search.createColumn({
                                name: "custrecord_ccs_tipo_de_retencion_codigo",
                                join: "CUSTRECORD_4601_GWTC_CODE"
                            }),
                            search.createColumn({
                                name: "formulanumeric",
                                formula: "{custrecord_4601_gwtc_code.custrecord_4601_wtc_rate}"
                            }),
                            search.createColumn({
                                name: "custrecord_4601_wtc_name",
                                join: "CUSTRECORD_4601_GWTC_CODE"
                            })
                        ]
                });
                var runTipoTasaRet = busqTipoTasaRet.run().getRange(0, 1);

                if (runTipoTasaRet.length > 0) {
                    var columns = runTipoTasaRet[0].columns;
                    var tipoRet = runTipoTasaRet[0].getValue(columns[1]);
                    var tasaRet = runTipoTasaRet[0].getValue(columns[2]);
                    var nameRet = runTipoTasaRet[0].getValue(columns[3]);
                    return {
                        "tipo_retencion": tipoRet,
                        "tasa_retencion": tasaRet,
                        "nombre_retencion": (nameRet.substring(0, 5)).toUpperCase()
                    }
                }

            } catch (e) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Error en la búsqueda de retenciones grupales", MY_SUBSIDIARY, "Error en la búsqueda de retenciones para saber si pertenece a un grupo");
                return false;
            }
        }


        //Devuelve los valores de una busqueda guardada
        function searchToJson(searchDetails, options) {
            try {
                var results = [];
                var method = 'searchToJson';
                if (!options) {
                    options = {
                        start: 0,
                        end: 1000
                    }
                }
                var searchResults = searchDetails.run().getRange(options);
                if (searchResults && searchResults.length > 0) {
                    searchResults.forEach(function (searchResult) {
                        var columns = searchResult.columns;
                        var recId = searchResult.id;
                        var recType = searchResult.type;

                        var thisResult = {};
                        thisResult.internalid = recId;
                        thisResult.type = recType;

                        columns.forEach(function (column) {
                            var column_key = column.label || column.name;
                            thisResult[column_key] = searchResult.getValue(column)
                        })
                        results.push(thisResult)
                    })
                }
                return results;

            } catch (e) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Error en la obtención de los datos de la transaccion", MY_SUBSIDIARY, "Error en la obtención de los datos de la transaccion");
                return false;
            }
        }


        // FORMATO DE HORAS
        function formatHour(_hour, _pm) {
            try {
                var hours = _hour.split(':');
                if (_pm == 'PM' && Number(hours[0]) < 12) hours[0] = Number(hours[0]) + 12;
                if (Number(hours[0]) < 10) hours[0] = '0' + hours[0];
                return hours[0] + ':' + hours[1];

            } catch (e) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Error en el formato de hora", MY_SUBSIDIARY, "Revisar que el formato sea HH:MM:ss AM/PM");
                return false;
            }
        }


        // OBTENER CREDENCIALES
        function getCredenciales(_id_credencial) {
            try {
                var credenciales = search.lookupFields({
                    type: 'customrecord_co_ei_enable_features',
                    id: _id_credencial,
                    columns: ['custrecord_co_ei_url_ws', 'custrecord_co_ei_password', 'custrecord_co_ei_content_type']
                });
                return {
                    'url_ws': credenciales['custrecord_co_ei_url_ws'],
                    'content_type': credenciales['custrecord_co_ei_content_type'],
                    'password': credenciales['custrecord_co_ei_password'],
                }
            } catch (error) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Error en la obtención de credenciales", MY_SUBSIDIARY, "Revisar que el record personalizado ENABLE FEATURE tengas las credenciales adecuadas");
                return false;
            }
        }


        // BUSQUEDA DOCUMENTOS RELACIONADOS
        function busqDocumentRelated(_ndoc) {
            try {
                var idDocRel = '';
                var dateDocRel = '';
                var busqDocRel = search.create({
                    type: "transaction",
                    filters: [
                        ["type", "anyof", "VendBill", "CustInvc", "PurchOrd", "SalesOrd"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["numbertext", "is", _ndoc]
                    ],
                    columns: ["internalid", "trandate"]
                });
                var runDocRel = busqDocRel.run().getRange(0, 1);
                if (runDocRel.length > 0) {
                    idDocRel = runDocRel[0].getValue("internalid");
                    dateDocRel = runDocRel[0].getValue("trandate");
                }
                return { "idDocRel": idDocRel, "dateDocRel": dateDocRel }
            } catch (e) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Error en la obtención de documentos relacionados", MY_SUBSIDIARY, "Revisar si el documento tiene relacion con otros documentos");
                return false;
            }
        }


        // BUSQUEDA TAX CODE DIAN
        function busquedaTaxCodeDIAN(_id_tax) {
            try {
                var resultCodeDian = search.lookupFields({
                    type: 'salestaxitem',
                    id: _id_tax,
                    columns: ['custrecord_fel_code_dian']
                });
                var codeDian = (resultCodeDian['custrecord_fel_code_dian'][0].text).substring(0, 2);
                return codeDian;

            } catch (e) {
                result.success = false;
                result.message = "Failure";
                logError(ID_TRANSACTION, USER_ID, "Código del tipo de impuesto no encontrado", MY_SUBSIDIARY, "Revise el campo FEL - CÓDIGO DIAN de la lista de los Códigos de Impuesto (Tax Codes)");
                return false;
            }
        }


        function logStatus(internalid, docstatus) {
            try {
                var logStatus = record.create({ type: 'customrecord_co_ei_document_status' });
                logStatus.setValue('custrecord_co_ei_document', internalid);
                logStatus.setValue('custrecord_co_ei_document_status', docstatus);
                logStatus.save();
            } catch (e) { }
        }


        function logError(_internalid, _userid, _docstatus, _subsidiaria, _response) {
            try {
                var logError = record.create({ type: "customrecord_co_ei_log_documents" });
                logError.setValue("custrecord_co_ei_log_related_transaction", _internalid);
                logError.setValue("custrecord_co_ei_log_subsidiary", _subsidiaria);
                logError.setValue("custrecord_co_ei_log_employee", _userid);
                logError.setValue("custrecord_co_ei_log_status", _docstatus);
                logError.setValue("custrecord_co_ei_log_response", _response);
                logError.save();
            } catch (e) { }
        }

        return {
            send: send,
        };
    });

/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 17/06/2022
Author: Jean Ñique
Description: Creación del script.
========================================================================================================================================================*/
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:02
Version: 1.1
Date: 27/06/2022
Author: Jean Ñique
Description: Modificación de los ids de los campos de los custom record de logs.
========================================================================================================================================================*/
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:03
Version: 1.2
Date: 01/07/2022
Author: Jean Ñique
Description: Modificación del script para que soporte los nuevos campos creados a nivel funcional.
========================================================================================================================================================*/
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:04
Version: 1.3
Date: 25/07/2022
Author: Jean Ñique
Description: Modificación del script para que soporte los casos de descuentos y retención.
========================================================================================================================================================*/
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:05
Version: 1.4
Date: 01/08/2022
Author: Jean Ñique
Description: Modificación del script para 0btener las credenciales a partir de un record personalizado.
========================================================================================================================================================*/
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:06
Version: 1.5
Date: 02/08/2022
Author: Jean Ñique
Description: Modificación del script para generar las retenciones por linea.
========================================================================================================================================================*/
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:07
Version: 1.6
Date: 26/08/2022
Author: Jean Ñique
Description: Modificación del script para generar facturas que fueron emitidas por otro proveedor
========================================================================================================================================================*/
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:08
Version: 1.7
Date: 01/09/2022
Author: Jean Ñique
Description: Modificación del script para generar facturas que no fueron creadas por NetSuite
========================================================================================================================================================*/
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:09
Version: 1.8
Date: 14/10/2022
Author: Jean Ñique
Description: Modificación del script para agregar los códigos de impuesto de la DIAN y el manejo de errores
========================================================================================================================================================*/