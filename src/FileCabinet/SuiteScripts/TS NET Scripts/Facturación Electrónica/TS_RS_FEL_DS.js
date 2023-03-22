/********************************************************************************************************************************************************
This script for Vendor Bill
/******************************************************************************************************************************************************** 
File Name: TS_RS_FEL_DS.js                                                                        
Commit: 01                                                        
Version: 1.1                                                                     
Date: 10/10/2022
ApiVersion: Script 2.x
Enviroment: PR
Governance points: N/A
========================================================================================================================================================*/
/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 */
define(["N/record", "N/search", "N/file", "N/https", "N/runtime", "N/encode"],

    function (record, search, file, https, runtime, encode) {

        var TYPE_TRANSACTION = "";
        var ID_TRANSACTION = "";
        var USER_ID = '';
        var sessionObj = '';
        var MY_SUBSIDIARY = 8;
        var FOLDER_FILES = 4433;
        var TXT_ERROR = 'Error en la construcción de la trama, revise CO EI Log of Documents de la subficha del documento electrónico';

        var result = {
            success: true,
            message: "success",
        };

        function _get(context) {

            log.debug('context', context);

            try {

                var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                sessionObj = runtime.getCurrentUser().id;
                log.debug('remaining usage inicio:' + remainingUsage);
                log.debug('sessionObj', sessionObj);

                ID_TRANSACTION = context.id;
                TYPE_TRANSACTION = context.type_rec;
                USER_ID = context.user;

                var searchOptions = { start: 0, end: 10 }
                var _searchEmployee = search.load({ id: 'customsearch_col_e_invoicing' });

                //Add Filters
                if (ID_TRANSACTION) {
                    _searchEmployee.filters.push(search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: [ID_TRANSACTION]
                    }))
                }
                var employeeResult = searchToJson(_searchEmployee, searchOptions);

                var docSoporte = employeeResult[0]['doc_soporte'];
                if (docSoporte) {
                    var rec = record.load({ type: TYPE_TRANSACTION, id: ID_TRANSACTION });
                    var subsidiaria = rec.getValue('subsidiary');

                    // FORMATO DE LA FECHA Y HORA
                    var dateTimeFel = (employeeResult[0]['date_created']).split(' ');
                    var timeFel = formatHour(dateTimeFel[1], dateTimeFel[2]) + ":00";
                    var dateFormated = formatDate(dateTimeFel[0]);
                    var dateFormated2 = formatDate(rec.getText('trandate'));

                    // DOCUMENTO RELACIONADO
                    var nmroDocRel = employeeResult[0]['creado_desde'];
                    var dateFormatedRel = '';
                    if (nmroDocRel) {
                        dateTimeFelRel = (employeeResult[0]['creado_desde_date']).split(' ');
                        dateFormatedRel = formatDate(dateTimeFelRel[0]);
                    }


                    var motivoFact = '';
                    var tipoDocumento = '';
                    if (employeeResult[0]['document_type'] == 'vendorbill') {
                        motivoFact = '01';
                        tipoDocumento = '05';
                        dueDocument = formatDate(employeeResult[0]['due_date_document']);
                    } else {
                        typeNdNc = employeeResult[0]['tipo_nc'];
                        tipoDocumento = '91';
                        dueDocument = dateFormated;
                    }

                    var nmroDocTrans = employeeResult[0]['correlativo_dian'];
                    var tipoOperacion = rec.getValue('custbody_co_ei_tipo_operacion_ds') == 1 ? '10' : '11';


                    // SECCION 01
                    var seccion01 = '01|'
                    seccion01 += tipoDocumento + '|';
                    seccion01 += motivoFact + '|';
                    seccion01 += nmroDocTrans + '|';
                    seccion01 += dateFormated2 + '|';
                    seccion01 += timeFel + '|';
                    seccion01 += tipoOperacion + '|';
                    seccion01 += (nmroDocRel || '') + '|';
                    seccion01 += dateFormatedRel + '|';
                    seccion01 += dueDocument + '|\n';


                    // SECCION 02
                    var arrayTaxes = (employeeResult[0]['taxes_details_vendor']).split(',');
                    var rutObligations = (employeeResult[0]['rut_obligations_vendor']).split(' ');
                    var recIdType = search.lookupFields({
                        type: 'customrecord_ccs_tipo_de_identificacion',
                        id: employeeResult[0]['identification_type_vendor'],
                        columns: ['custrecord_ccs_codigo_dane']
                    });

                    var seccion02 = '02|';
                    var tipoVendor = employeeResult[0]['legal_organization_vendor'];
                    var addressVendor = employeeResult[0]['address_vendor'];
                    if (addressVendor) addressVendor = addressVendor.replace(/(\r\n|\n|\r|\t)/gm, " ");

                    seccion02 += tipoVendor + '|';
                    seccion02 += (tipoOperacion == '10' ? '31' : recIdType['custrecord_ccs_codigo_dane']) + '|';
                    seccion02 += employeeResult[0]['identification_number_vendor'] + '|';
                    seccion02 += (tipoVendor == 1 ? employeeResult[0]['name_vendor'] : employeeResult[0]['name_vendor_ind']) + '|';
                    seccion02 += employeeResult[0]['codigo_city_vendor'] + '|';
                    seccion02 += employeeResult[0]['city_vendor'] + '|';
                    seccion02 += employeeResult[0]['codigo_city_vendor'] + '|';
                    seccion02 += employeeResult[0]['department_code_vendor'] + '|';
                    seccion02 += employeeResult[0]['department_vendor'] + '|';
                    seccion02 += addressVendor + '|';
                    seccion02 += (employeeResult[0]['country_code_vendor'] || 'CO') + '|';
                    seccion02 += (employeeResult[0]['country_name_vendor'] || 'Colombia') + '|';
                    seccion02 += rutObligations[0] + '|';
                    seccion02 += (arrayTaxes[0]).substring(0, 2) + '|';
                    seccion02 += employeeResult[0]['email_vendor'] + '|';
                    seccion02 += employeeResult[0]['phone_vendor'] + '|\n';


                    // SECCION 03
                    var seccion03 = '03|1|31|';
                    seccion03 += employeeResult[0]['identification_number_emi'] + '|';
                    seccion03 += employeeResult[0]['emisor_name_emi'] + '|';
                    seccion03 += 'O-13|';
                    seccion03 += '01|';
                    seccion03 += employeeResult[0]['email_subsidiary'] + '|';
                    seccion03 += employeeResult[0]['phone_subsidiary'] + '|\n';


                    var taxrate = rec.getSublistValue({ sublistId: "item", fieldId: "taxrate1", line: 0 });
                    var taxcode = '01';
                    var mntTotal = 0.00;
                    var taxTotal = 0.00;
                    var dsctoTotal = 0.00;

                    var nmroLine = rec.getLineCount('item');
                    var currentDate = new Date();
                    var month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
                    var day = ('0' + currentDate.getDate()).slice(-2);
                    var year = currentDate.getFullYear();

                    var seccion12 = '';
                    var seccion13 = '';
                    var seccion14 = '';
                    var seccion15 = '';
                    for (var i = 0; i < nmroLine; i++) {
                        var itemType = rec.getSublistValue({ sublistId: "item", fieldId: "itemtype", line: i });
                        if (itemType !== "Discount") {
                            var amountItem = Number(rec.getSublistValue({ sublistId: "item", fieldId: "amount", line: i })).toFixed(2);
                            // SECCION 12
                            seccion12 += '12|';
                            seccion12 += (i + 1) + '|';
                            seccion12 += '01000A' + '|';
                            seccion12 += rec.getSublistValue({ sublistId: "item", fieldId: "item", line: i }) + '|';
                            seccion12 += ((rec.getSublistValue({ sublistId: "item", fieldId: "description", line: i })).replace(/(\r\n|\n|\r|\t)/gm, "") || 'Sin descripción') + '|';
                            seccion12 += Number(rec.getSublistValue({ sublistId: "item", fieldId: "quantity", line: i })).toFixed(2) + '|';
                            seccion12 += '94' + '|';
                            seccion12 += Number(rec.getSublistValue({ sublistId: "item", fieldId: "rate", line: i })).toFixed(2) + '|';
                            seccion12 += amountItem + '|';
                            seccion12 += 'marca|';
                            seccion12 += 'modelo|';
                            seccion12 += year + '-' + month + '-' + day + '|\n';


                            // SECCION 13
                            var taxAmountItem = Number(rec.getSublistValue({ sublistId: "item", fieldId: "tax1amt", line: i })).toFixed(2);
                            seccion13 += '13|';
                            seccion13 += (i + 1) + '|';
                            seccion13 += '01' + '|';
                            seccion13 += taxAmountItem + '|';
                            seccion13 += Number(rec.getSublistValue({ sublistId: "item", fieldId: "taxrate1", line: i })).toFixed(2) + '|';
                            seccion13 += amountItem + '|';
                            seccion13 += 'UN' + '|';
                            seccion13 += '94' + '|';
                            seccion13 += '0.00' + '|\n';


                            // SECCION 14 (DESCUENTO)
                            var amountDesc = 0.00;
                            var taxAmountDesc = 0.00;

                            // SECCION 15 (RETENCIONES)
                            var iswht = rec.getSublistValue({ sublistId: "item", fieldId: "custcol_4601_witaxapplies", line: i });
                            if (iswht) {
                                seccion15 += '15|';
                                seccion15 += (i + 1) + '|';
                                var whtTaxCode = Number(rec.getSublistValue({ sublistId: "item", fieldId: "custcol_4601_witaxcode", line: i }));
                                var amountWhtTax = rec.getSublistValue({ sublistId: "item", fieldId: "custcol_4601_witaxbaseamount", line: i });
                                log.debug('amountWhtTax', amountWhtTax);
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
                                        logError(ID_TRANSACTION, sessionObj, "Error en el nombre de la retención", subsidiaria, "El nombre de la rentención debe iniciar con RTFUE, RTICA y RTIVA");
                                        result.success = false;
                                    }

                                    seccion15 += whtcode + '|';
                                    seccion15 += Number(amountWhtTax).toFixed(2) + '|';
                                    seccion15 += (Number(tasaRetencion[ele]["tasa_retencion"] * 100).toFixed(2) || "0.00") + '|';
                                    seccion15 += Number(amountWhtTax * tasaRetencion[ele]["tasa_retencion"]).toFixed(2) + '|\n';
                                }
                            }

                            mntTotal += (Number(amountItem) + Number(taxAmountItem) - (Number(amountDesc) + Number(taxAmountDesc)));
                            taxTotal += Number(taxAmountItem - taxAmountDesc);
                            dsctoTotal += Number(amountDesc);

                        }
                    }


                    // ************************************************ SECCION DE CALCULOS TOTALES ************************************************ //
                    var subTotal = mntTotal - taxTotal;
                    log.debug('mntTotal', mntTotal);
                    log.debug('taxTotal', taxTotal);
                    log.debug('subTotal', subTotal);
                    log.debug('dsctoTotal', dsctoTotal);


                    // SECCION 10
                    var seccion10 = '';
                    seccion10 += '10|';
                    seccion10 += taxcode + '|';
                    seccion10 += Number(subTotal).toFixed(2) + '|';
                    seccion10 += Number(taxrate).toFixed(2) + '|';
                    seccion10 += Number(taxTotal).toFixed(2) + '|';
                    seccion10 += '1.00' + '|';
                    seccion10 += 'NIU' + '|';
                    seccion10 += '0.00' + '|\n';


                    // SECCION 11
                    var cargos = 0.00;
                    var seccion11 = '11|';
                    seccion11 += Number(subTotal).toFixed(2) + '|';
                    seccion11 += Number(subTotal).toFixed(2) + '|';
                    seccion11 += Number(mntTotal).toFixed(2) + '|';
                    seccion11 += Number(dsctoTotal).toFixed(2) + '|';
                    seccion11 += Number(cargos).toFixed(2) + '|';
                    seccion11 += Number(mntTotal).toFixed(2) + '|';
                    seccion11 += rec.getText('currency') + '\n';


                    // SECCION 19
                    var arrayMedioPago = (employeeResult[0]['medio_pago']).split('-');
                    var seccion19 = '19|';
                    seccion19 += employeeResult[0]['metodo_pago'] + '|';
                    seccion19 += arrayMedioPago[0] + '|';
                    seccion19 += dueDocument + '|';
                    seccion19 += arrayMedioPago[1] + '|\n';


                    var seccionTotal = seccion01 + seccion02 + seccion03 + seccion10 + seccion11 + seccion12 + seccion13 + seccion14 + seccion15 + seccion19;
                    log.debug('Total seccion', seccionTotal);

                    //var fileTxt = getFileTXT(nmroDocTrans, seccionTotal);
                    //log.debug('fileTxtn', fileTxt);


                    var codifUTF8 = encode.convert({
                        string: seccionTotal,
                        inputEncoding: encode.Encoding.UTF_8,
                        outputEncoding: encode.Encoding.BASE_64
                    });

                    // JSON QUE ENVIA PARA FACTURAR
                    var jsonFacturador = {
                        "txtEncode": codifUTF8
                    }

                    var pdfDian = {
                        "nit": employeeResult[0]['identification_number_emi'],
                        "tipo_documento": tipoDocumento,
                        "numeral": nmroDocTrans
                    }

                    log.debug('jsonFacturador', jsonFacturador);
                    log.debug('pdfDian', pdfDian);

                    var rpta = sendDocument(jsonFacturador);
                    var resPdfDian = getPdfDian(pdfDian);
                    log.debug('rpta', rpta);
                    log.debug('resPdfDian', resPdfDian);

                    if (rpta['estado'] === 2) {

                        rec.setValue('custbody_ccs_cufe', resPdfDian['cufe']);
                        rec.setValue('custbody_ts_pdf_fel_dian', resPdfDian['pdf']);
                        rec.setValue('custbody_ts_fel_qr_dian', resPdfDian['qrcode']);
                        logStatus(ID_TRANSACTION, rpta['message']);

                    } else {
                        var error = rpta['estado'] == "3" ? rpta['error_detail'] : rpta['message'];
                        logError(ID_TRANSACTION, sessionObj, "Error al enviar documento a la DIAN", subsidiaria, error);
                        if (rpta['estado'] == "3") logStatus(ID_TRANSACTION, rpta['message']);
                        result.success = false;
                        result.message = "Failure: " + rpta['message'];
                    }
                    rec.save({ ignoreMandatoryFields: true, enableSourcing: false });
                }

                var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                log.debug('remaining usage fin:' + remainingUsage);

            } catch (error) {
                result.success = false;
                result.message = "Failure: " + error.message;
            }

            log.debug('result.message', result.message);

            return result.message;
        }


        // CONVIERTE A LA FECHA EN FORMATO YYYY-MM-DD
        function formatDate(dateString) {
            try {
                var date = dateString.split('/');
                if (Number(date[0]) < 10) date[0] = '0' + Number(date[0]);
                if (Number(date[1]) < 10) date[1] = '0' + Number(date[1]);
                return date[2] + '-' + date[1] + '-' + date[0];
            } catch (e) {
                logError(ID_TRANSACTION, sessionObj, "Error en el formato Fecha", MY_SUBSIDIARY, "Revisar que la fecha tenga formato DD/MM/YYYY");
                result.success = false;
                result.message = "Failure: " + TXT_ERROR;
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
                logError(ID_TRANSACTION, sessionObj, "Error en el formato de hora", MY_SUBSIDIARY, "Revisar que el formato sea HH:MM:ss AM/PM");
                result.success = false;
                result.message = "Failure: " + TXT_ERROR;
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
                logError(ID_TRANSACTION, sessionObj, "Error en la obtención del código DANE", MY_SUBSIDIARY, "No se encontró el código DANE para la ciudad/municipio");
                result.success = false;
                result.message = "Failure: " + TXT_ERROR;
            }
        }


        // obtener ciudad y código postal de la dirección de la entidad
        function getZipCityAddress(_type_entity, _id_entity) {
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

        }


        // FUNCIÓN QUE ENVIA EL DOCUMENTO A LA DIAN
        function sendDocument(_object) {
            try {
                var credencialEnvioDS = getCredenciales(3);
                var headers = new Array();
                headers['Authorization'] = credencialEnvioDS["password"];
                headers['Content-Type'] = credencialEnvioDS["content_type"];

                var url = credencialEnvioDS["url_ws"];
                var req = JSON.stringify(_object);

                var myresponse = https.post({
                    url: url,
                    headers: headers,
                    body: req
                });

                var mensajeRes = JSON.parse(myresponse.body);

                return {
                    estado: mensajeRes['estado'],
                    error_detail: mensajeRes['error_detail'],
                    message: mensajeRes['message'],
                    cufe: mensajeRes['cufe'],
                    pdf: mensajeRes['pdf'],
                }
            } catch (e) {
                var txt_send_dian = "Error en la respuesta de las API de ESTUPENDO que envía el documento";
                logError(ID_TRANSACTION, sessionObj, "Error al enviar el documento a ESTUPENDO", MY_SUBSIDIARY, txt_send_dian);
                result.success = false;
                result.message = "Failure: " + txt_send_dian;
            }
        }


        // FUNCION PARA OBTENER EL PDF DE LA DIAN
        function getPdfDian(_object) {
            try {
                var credencialEnvioDS = getCredenciales(4);
                var headers = new Array();
                headers['Authorization'] = credencialEnvioDS["password"];
                headers['Content-Type'] = credencialEnvioDS["content_type"];

                var url = credencialEnvioDS["url_ws"];
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
                var txt_send_pdf_dian = "Error en la respuesta de la API de ESTUPENDO que consulta el estado del documento";
                logError(ID_TRANSACTION, sessionObj, "Error consultar el estado del documento a ESTUPENDO", MY_SUBSIDIARY, txt_send_pdf_dian);
                result.success = false;
                result.message = "Failure: " + txt_send_pdf_dian;
            }
        }


        // GUARDA LOS ARCHIVOS EN EL FILE CABINET
        function getFileTXT(_name, content) {
            try {

                var fileObj = file.create({
                    name: 'DS_' + _name + '.txt',
                    fileType: file.Type.PLAINTEXT,
                    contents: content,
                    folder: 4433
                });
                var fileid = fileObj.save();

                return fileid;
            } catch (e) {
                //logError(array[0], array[1], 'Error-generateFileJSON', e.message);
                log.debug('error file TXT', e);
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
                var txt_credenciales = "Revisar que el record personalizado ENABLE FEATURE tengas las credenciales adecuadas";
                logError(ID_TRANSACTION, sessionObj, "Error en la obtención de credenciales", MY_SUBSIDIARY, txt_credenciales);
                result.success = false;
                result.message = "Failure: " + txt_credenciales;
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
                logError(ID_TRANSACTION, sessionObj, "Error en la búsqueda de retenciones", MY_SUBSIDIARY, "Error en la búsqueda de retenciones a nivel individual o grupal");
                result.success = false;
                result.message = "Failure: " + TXT_ERROR;
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
                logError(ID_TRANSACTION, sessionObj, "Error en la búsqueda de retenciones grupales", MY_SUBSIDIARY, "Error en la búsqueda de retenciones para saber si pertenece a un grupo");
                result.success = false;
                result.message = "Failure: " + TXT_ERROR;
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
                return results
            } catch (e) {
                logError(ID_TRANSACTION, sessionObj, "Error en la obtención de los datos de la transaccion", MY_SUBSIDIARY, "Error en la obtención de los datos de la transaccion");
                return false;
            }
        }


        function logStatus(internalid, docstatus) {
            try {
                var logStatus = record.create({ type: 'customrecord_co_ei_document_status' });
                logStatus.setValue('custrecord_co_ei_document', internalid);
                logStatus.setValue('custrecord_co_ei_document_status', docstatus);
                logStatus.save();
            } catch (e) {

            }
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
            } catch (e) {

            }
        }

        return {
            get: _get,
        }
    });

/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 26/07/2022
Author: Jean Ñique
Description: Creación del script.
========================================================================================================================================================*/
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.1
Date: 10/10/2022
Author: Jean Ñique
Description: Ajuste para soportar el campo dirección del Proveedor.
========================================================================================================================================================*/