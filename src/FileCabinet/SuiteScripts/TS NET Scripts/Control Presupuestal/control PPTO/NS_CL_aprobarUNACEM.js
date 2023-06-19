/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/record', 'N/currentRecord', 'N/transaction', 'N/email', 'N/search'],

    function (url, record, currentRecord, transaction, email, search) {
        var ENVIO_PLATAFORMAS = '5';
        var TIPO_TRANSACCION = '2';

        const pageInit = (scriptContext) => {
            alert('hola mundo'); //!Importante, no borrar.
        }

        const aprobarVenta = (id, nextAprobal, roll, type, transaction, url, role) => {
            console.log('id', id);
            console.log('nextAprobal', nextAprobal);
            console.log('roll', roll);
            console.log('type', type);
            console.log('transaction', transaction);
            console.log('url', url);
            console.log('role', role);
            let idRecordNumber = parseInt(id);
            let arr = [];
            let objRecord = record.load({ type: 'employee', id: nextAprobal, isDynamic: true });
            var numLines = objRecord.getLineCount({ sublistId: 'roles' });
            let rollcomparacion = false;
            for (let index = 0; index < numLines; index++) {
                let roles = objRecord.getSublistValue({ sublistId: 'roles', fieldId: 'selectedrole', line: index });
                console.log("Roles: ", roles);
                if (roles == roll) {
                    rollcomparacion = true;
                }

            }

            console.log(transaction);
            try {
                if (rollcomparacion || role == roll) {
                    console.log('Log1', 'Log1');
                    let order = record.load({ type: transaction, id: id, isDynamic: true });
                    order.setValue({ fieldId: transaction == 'custompurchasepayment_order' ? 'transtatus' : 'approvalstatus', value: type })
                    var fechaHoraActual = new Date();
                    var campo1 = order.getValue('custbodywf_prueba1');
                    console.log('campo1', campo1);
                    if (campo1 == '') {
                        console.log('Log2', 'Log2');
                        order.setValue('custbodywf_prueba1', fechaHoraActual);
                        order.setValue('custbodywf_prueba2', fechaHoraActual);
                    } else {
                        console.log('Log3', 'Log3');
                        order.setValue('custbodywf_prueba2', fechaHoraActual);
                    }
                    order.save();
                    location.reload();
                } else {
                    var employeeSearchObj = search.create({
                        type: "employee",
                        filters:
                            [
                                ["role", "anyof", roll]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "Internal ID" })
                            ]
                    });
                    var pageData = employeeSearchObj.runPaged({
                        pageSize: 1000
                    });
                    pageData.pageRanges.forEach(function (pageRange) {
                        page = pageData.fetch({
                            index: pageRange.index
                        });

                        page.data.forEach(function (result) {
                            var columns = result.columns;
                            for (let i = 0; i < columns.length; i++) {
                                console.log(result.getValue(columns[i]));
                                arr.push(result.getValue(columns[i]));
                            }

                        });
                    });
                    var fechaHoraActual = new Date();
                    var campo1 = search.lookupFields({
                        type: transaction,
                        id: id,
                        columns: ['custbodywf_prueba1']
                    });
                    var campo1 = campo1.custbodywf_prueba1;
                    if (campo1) {

                    } else {
                        record.submitFields({
                            type: transaction,
                            id: id,
                            values: {
                                'custbodywf_prueba1': fechaHoraActual
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    }
                    email.send({
                        author: nextAprobal, //9083, // context.getValue('employee'),
                        recipients: arr.length ? arr : arr[0],//currentRecord.getValue('custbodylh_aprobador'),    // recordType=='exprept'?context.getValue('nextapprover'):context.getValue('custbodylh_aprobador'),
                        subject: 'Aprobar Presupuesto ' + id, // 'Autorizar PEDIDO ',
                        body: "<p>Presupuesto Pendiente de aprobar porfavor entrar al siguiente enlace para aprobar el presupuesto <a href='" + url + "/app/accounting/transactions/purchord.nl?id=" + id + "'>Orden de compra</a>  </p>", //pdfTemplate.getContents(), //emailBody, //'HOLA', //myvar,
                        relatedRecords: {
                            transactionId: idRecordNumber
                        }
                    });
                    location.reload();
                }
            } catch (error) {
                console.log('Error: ', error);
            }

        }
        const aprobarrequisition = (id, nextAprobal, type) => {
            console.log(id);
            let order = record.load({ type: 'purchaserequisition', id: id, isDynamic: true });
            order.setValue({ fieldId: 'approvalstatus', value: type })
            order.save();
            location.reload();
        }






        return {
            pageInit: pageInit,
            aprobarVenta: aprobarVenta,
            aprobarrequisition: aprobarrequisition
        };

    });
