/**
 *@NApiVersion 2.1
 *@NModuleScope Public
 *@NScriptType Suitelet
 */
define(['N/log', 'N/ui/serverWidget', 'N/record', 'N/search', 'N/file', 'N/email', 'N/render'],
    function (log, serverWidget, record, search, file, email, render) {
        function onRequest(context) {
            var objClass = {};
            if (context.request.method === 'GET') {
                log.error('INICIO', 'INICIO APROBACION====================================');
                var fields = context.request.parameters.data.split('.');
                var recordType = fields[0];
                var idRecord = fields[1];
                log.error('recordtype', recordType);
                log.error('parametros', recordType + idRecord);
                recordType = recordType == 'exprept' ? 'expensereport' : 'purchaseorder';
                var currentRecord = record.load({ type: recordType, id: idRecord });
                var solicitante = recordType == 'exprept' ? currentRecord.getValue('entityname') : currentRecord.getText('employee');
                var autor = recordType == 'expensereport' ? currentRecord.getValue('entity') : currentRecord.getValue('employee');
                var aprobador = currentRecord.getValue('custbodylh_aprobador');
                log.error('autor', autor);
                log.error('entity', currentRecord.getValue('entity'));
                log.error('entityText', currentRecord.getText('entity'));
                log.error('entityNametext', currentRecord.getText('entityname'));
                log.error('entityName', currentRecord.getValue('entityname'));
                var adjuntos = [];
                adjuntos = AgregarAdjuntos(recordType, idRecord);

                //!SB
                // var mergeResult = render.mergeEmail({
                //     templateId: 110,
                //     entity: null,
                //     recipient: null,
                //     supportCaseId: null,
                //     transactionId: Number(idRecord),
                //     customRecord: null
                // });

                //!Ambos
                var pdfTemplate = render.transaction({
                    entityId: Number(idRecord),
                    printMode: render.PrintMode.HTML
                    // formId: 110
                });
                // adjuntos.push(pdfTemplate);

                //!SB
                var emailBody = pdfTemplate.getContents() + '<p> <a href="https://6776158-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=993&deploy=1&compid=6776158_SB1&h=268b107dc5eb0ebed55f&data=' + recordType + '.' + idRecord + '.SI.' + autor + '.' + aprobador + '"> APROBAR</a></p>' +
                    '&nbsp; &nbsp; &nbsp; &nbsp;  &nbsp;' + '<p> <span style="color: #ff0000;"> <a style="color: #ff0000;" href="https://6776158-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=993&deploy=1&compid=6776158_SB1&h=268b107dc5eb0ebed55f&data=' + recordType + '.' + idRecord + '.NO.' + autor + '.' + aprobador + '"> RECHAZAR</a></p>' +
                    '<p> </p>';
                    // var emailBody = pdfTemplate.getContents() + '<p> <a href="https://6776158-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=993&deploy=1&compid=6776158&h=63e10a48a343d349f44b&data=' + fields[0] + '.' + idRecord + '.SI.' + autor + '.' + aprobador + '"> APROBAR</a></p>' +
                    // '&nbsp; &nbsp; &nbsp; &nbsp;  &nbsp;' + '<p> <span style="color: #ff0000;"> <a style="color: #ff0000;" href="https://6776158.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=993&deploy=1&compid=6776158&h=63e10a48a343d349f44b&data=' + fields[0] + '.' + idRecord + '.NO.' + autor + '.' + aprobador + '"> RECHAZAR</a></p>' +
                    // '<p> </p>';

                //!PR
                log.error('field[0]', fields[0]);
                // var emailBody = pdfTemplate.getContents() + '<p> <a href="https://6776158.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=993&deploy=1&compid=6776158&h=63e10a48a343d349f44b&data=' + fields[0] + '.' + idRecord + '.SI.' + autor + '.' + aprobador + '"> APROBAR</a></p>' +
                //     '&nbsp; &nbsp; &nbsp; &nbsp;  &nbsp;' + '<p> <span style="color: #ff0000;"> <a style="color: #ff0000;" href="https://6776158.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=993&deploy=1&compid=6776158&h=63e10a48a343d349f44b&data=' + fields[0] + '.' + idRecord + '.NO.' + autor + '.' + aprobador + '"> RECHAZAR</a></p>' +
                //     '<p> </p>';

                //!SB
                //aprobador = 21633 //PR - 27160 //SB - 21633
                email.send({
                    author: autor, //9083, // context.getValue('employee'),
                    recipients: aprobador,    // recordType=='exprept'?context.getValue('nextapprover'):context.getValue('custbodylh_aprobador'),
                    subject: recordType == 'expensereport' ? 'Autorizar Informe de Gastos' : 'Autorizar Pedido', // 'Autorizar PEDIDO ',
                    body: emailBody, //pdfTemplate.getContents(), //emailBody, //'HOLA', //myvar,
                    attachments: adjuntos,
                    relatedRecords: {
                        transactionId: currentRecord.getValue('id')
                    }
                });
                log.error('FIN', 'FIN APROBACION====================================');
                var form = buildForm(context);
                // context.response.writePage(true);
                context.response.writePage(form);
            }
        }



        function AgregarAdjuntos(recordType, idRecord) {
            var attachID = [];
            log.error('entraAjuntos', 'si')
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
                    log.error('ID INTERNO DE  ARCHIVO', r.getValue({ name: "internalid", join: "file" }));

                });
            });
            var attachfiles = [];

            for (var i = 0; i < attachID.length; i++) {
                log.error('idArchivo', attachID[i]);
                if (attachID[i] != '')
                    attachfiles.push(file.load({ id: attachID[i] }));
            }
            return attachfiles;
        }


        function buildForm(context) {
            var fields = context.request.parameters.data.split('.');
            var recordType = fields[0];
            var idRecord = fields[1];
            var Aprobado = fields[2];

            var titulo = Aprobado == 'SI' ? 'Aprobación por EMAIL con exito' : 'Rechazado por Email con exito';
            var form = serverWidget.createForm({ title: titulo });

            var customerField = form.addField({
                id: 'custpage_customer',
                type: 'text',
                label: 'ID DEL PEDIDO'
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            customerField.defaultValue = context.request.parameters.data
            return form;
        }

        return {
            onRequest: onRequest
        };
    });