/**
 * @NApiVersion 2.1
 */
define(['N/log',
    'N/search',
    'N/record',
    '../constant/TS_CM_Constant',
],
    (log, search, record, _constant) => {
        const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal'; //CO Configuración Presupuestal Search - CP PRODUCCION
        const CATEGORIA_PERIODO_RECORD = 'customrecord_lh_categoriap_periodo';
        const RESERVADO_SEARCH = 'customsearch_control_ppto_reservado'; //Control Presupuestal RESERVADO - PRODUCCIÓN
        const COMPROMETIDO_SEARCH = 'customsearch_control_ppto_comprometido'; //Control Presupuestal COMPROMETIDO - PRODUCCIÓN
        const EJECUTADO_SEARCH = 'customsearch_control_ppto_ejecutado'; //Control Presupuestal EJECUTADO - PRODUCCIÓN
        const TIPO_CAMBIO_SEARCH = 'customsearch_co_tipo_cambio'; //CO Tipo Cambio Search - CP PRODUCCION
        const ADI_TRANS_RECORD = 'customrecord_lh_categoriap_transferencia';
        const ADICION_PPTO = 1;
        const TRANSFERENCIA_PPTO = 2;
        const COP = 1
        const MXN = 5

        return ({
            getAllPresupuestado: (fdesde, fhasta, arrayId) => {
                let presupuestoResultJson = {};
                let year = fdesde.split('/')[2];
                let from = parseInt(fdesde.split('/')[1]);
                let to = parseInt(fhasta.split('/')[1]);

                let presupuestado = search.create({
                    type: CATEGORIA_PERIODO_RECORD,
                    filters: [
                        ["custrecord_lh_detalle_cppto_status", "anyof", "1"],
                        "AND",
                        ["custrecord_lh_detalle_cppto_categoria", "anyof", arrayId],
                        "AND",
                        ["custrecord_lh_detalle_cppto_anio.name", "haskeywords", year]
                    ],
                    columns: [
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_categoria", label: "Mensual" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_01", label: "Enero" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_02", label: "Febrero" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_03", label: "Marzo" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_04", label: "Abril" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_05", label: "Mayo" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_06", label: "Junio" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_07", label: "Julio" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_08", label: "Agosto" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_09", label: "Septiembre" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_10", label: "Octubre" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_11", label: "Noviembre" }),
                        search.createColumn({ name: "custrecord_lh_detalle_cppto_12", label: "Diciembre" })
                    ]
                });

                var pagedData = presupuestado.runPaged({ pageSize: 1000 });
                if (pagedData.count <= 4000) {
                    presupuestado.run().each(function (result) {
                        let categoriaId = result.getValue("custrecord_lh_detalle_cppto_categoria");
                        if (presupuestoResultJson[categoriaId] === undefined) presupuestoResultJson[categoriaId] = 0;
                        for (let i = from; i <= to; i++) {
                            let mes = i <= 9 ? `0${i}` : `${i}`;
                            presupuestoResultJson[categoriaId] = presupuestoResultJson[categoriaId] + Number(result.getValue(`custrecord_lh_detalle_cppto_${mes}`));
                            presupuestoResultJson[categoriaId] = Math.round(presupuestoResultJson[categoriaId] * 100) / 100;
                        }
                        return true;
                    });
                } else {
                    pagedData.pageRanges.forEach(function (pageRange) {
                        page = pagedData.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            let categoriaId = result.getValue("custrecord_lh_detalle_cppto_categoria");
                            if (presupuestoResultJson[categoriaId] === undefined) presupuestoResultJson[categoriaId] = 0;
                            for (let i = from; i <= to; i++) {
                                let mes = i <= 9 ? `0${i}` : `${i}`;
                                presupuestoResultJson[categoriaId] = presupuestoResultJson[categoriaId] + Number(result.getValue(`custrecord_lh_detalle_cppto_${mes}`));
                                presupuestoResultJson[categoriaId] = Math.round(presupuestoResultJson[categoriaId] * 100) / 100;
                            }
                        });
                    });
                }
                return presupuestoResultJson;
            },

            getAllReservado: (fdesde, fhasta, arrayId) => {
                log.error("pipipi", JSON.stringify({ fdesde, fhasta, arrayId }));
                let reservadoResultJson = {};

                let reservado = search.load({ id: RESERVADO_SEARCH });
                let filters1 = reservado.filters;
                const filterOne = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [fdesde, fhasta] });
                filters1.push(filterOne);
                const filterThree = search.createFilter({ name: 'custcol_lh_ppto_flag', operator: search.Operator.ANYOF, values: arrayId });
                filters1.push(filterThree);

                var pagedData = reservado.runPaged({ pageSize: 1000 });
                if (pagedData.count <= 4000) {
                    reservado.run().each(function (result) {
                        let categoriaId = result.getValue(result.columns[0]);
                        reservadoResultJson[categoriaId] = Number(result.getValue(result.columns[1]));
                        return true;
                    });
                } else {
                    pagedData.pageRanges.forEach(function (pageRange) {
                        page = pagedData.fetch({
                            index: pageRange.index
                        });
                        page.data.forEach(function (result) {
                            let categoriaId = result.getValue(result.columns[0]);
                            reservadoResultJson[categoriaId] = Number(result.getValue(result.columns[1]));
                        });
                    });
                }
                return reservadoResultJson;
            },

            getAllComprometido: (fdesde, fhasta, arrayId) => {
                let comprometidoResultJson = {};

                let comprometido = search.load({ id: COMPROMETIDO_SEARCH });
                let filters1 = comprometido.filters;
                const filterOne = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [fdesde, fhasta] });
                filters1.push(filterOne);
                const filterThree = search.createFilter({ name: 'custcol_lh_ppto_flag', operator: search.Operator.ANYOF, values: arrayId });
                filters1.push(filterThree);
                var pagedData = comprometido.runPaged({ pageSize: 1000 });

                if (pagedData.count <= 4000) {
                    comprometido.run().each(function (result) {
                        let categoriaId = result.getValue(result.columns[0]);
                        comprometidoResultJson[categoriaId] = Number(result.getValue(result.columns[1]));
                        return true;
                    });
                } else {
                    pagedData.pageRanges.forEach(function (pageRange) {
                        page = pagedData.fetch({
                            index: pageRange.index
                        });
                        page.data.forEach(function (result) {
                            let categoriaId = result.getValue(result.columns[0]);
                            comprometidoResultJson[categoriaId] = Number(result.getValue(result.columns[1]));
                        });
                    });
                }
                return comprometidoResultJson;
            },

            getAllEjecutado: (fdesde, fhasta, arrayId) => {
                let ejecutadoResultJson = {};

                let ejecutado = search.load({ id: EJECUTADO_SEARCH });
                let filters1 = ejecutado.filters;
                const filterOne = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [fdesde, fhasta] });
                filters1.push(filterOne);
                const filterThree = search.createFilter({ name: 'custcol_lh_ppto_flag', operator: search.Operator.ANYOF, values: arrayId });
                filters1.push(filterThree);
                var pagedData = ejecutado.runPaged({ pageSize: 1000 });

                if (pagedData.count <= 4000) {
                    ejecutado.run().each(function (result) {
                        let categoriaId = result.getValue(result.columns[0]);
                        ejecutadoResultJson[categoriaId] = Number(result.getValue(result.columns[1]));
                        return true;
                    });
                } else {
                    pagedData.pageRanges.forEach(function (pageRange) {
                        page = pagedData.fetch({
                            index: pageRange.index
                        });
                        page.data.forEach(function (result) {
                            let categoriaId = result.getValue(result.columns[0]);
                            ejecutadoResultJson[categoriaId] = Number(result.getValue(result.columns[1]));
                        });
                    });
                }

                return ejecutadoResultJson;
            },

            getPresupuestado: (fdesde, fhasta, categoriappto) => {
                let pre = 0;
                let year = fdesde.split('/')[2];
                //*PRESUPUESTADO =============================================================================================================================================================
                const presupuestado = search.create({
                    type: CATEGORIA_PERIODO_RECORD,
                    filters:
                        [
                            ["custrecord_lh_detalle_cppto_status", "anyof", "1"],
                            "AND",
                            ["custrecord_lh_detalle_cppto_categoria", "anyof", categoriappto],
                            "AND",
                            ["custrecord_lh_detalle_cppto_anio.name", "haskeywords", year]
                        ],
                    columns:
                        [
                            'internalid'
                        ]
                });
                let resultCount = presupuestado.runPaged().count;
                //console.log('Res',resultCount);
                if (resultCount != 0) {
                    let result = presupuestado.run().getRange({ start: 0, end: 1 });
                    //console.log('result',JSON.stringify(result));
                    let internalid = result[0].getValue(presupuestado.columns[0]);
                    let recordLoad = record.load({ type: CATEGORIA_PERIODO_RECORD, id: internalid, isDynamic: true });
                    let from = parseInt(fdesde.split('/')[1]);
                    let to = parseInt(fhasta.split('/')[1]);
                    //console.log('Fechas',from + '-' + to);
                    for (let i = from; i <= to; i++) {
                        if (i <= 9) {
                            i = '0' + i
                        }
                        //console.log('I', i);
                        let monto = parseFloat(recordLoad.getValue('custrecord_lh_detalle_cppto_' + i));
                        pre += monto
                    }
                }

                //*ADICION ==================================================================================================================================================================
                // const adicion = search.create({
                //     type: ADI_TRANS_RECORD,
                //     filters:
                //         [
                //             ["custrecord_lh_detalle_cppto_solicitud", "anyof", "1", "2"],
                //             "AND",
                //             ["custrecord_lh_detalle_cppto_estado_aprob", "anyof", "2"],
                //             "AND",
                //             ["custrecord_lh_detalle_cppto_fecha_adi", "within", fdesde, fhasta],
                //             "AND",
                //             ["custrecord_lh_detalle_cppto_partida_adi", "anyof", categoriappto]
                //         ],
                //     columns:
                //         [
                //             search.createColumn({ name: "custrecord_lh_detalle_cppto_partida_adi", label: "Partida a Adicionar" }),
                //             search.createColumn({ name: "custrecord_lh_detalle_cppto_fecha_adi", label: "Fecha a Adicionar" }),
                //             search.createColumn({ name: "custrecord_lh_detalle_cppto_aumento_ppto", label: "Monto" })
                //         ]
                // });
                // let resultCount2 = adicion.runPaged().count;
                // if (resultCount2 != 0) {
                //     let result = adicion.run().getRange({ start: 0, end: 900 });
                //     for (let i in result) {
                //         let monto = parseFloat(result[i].getValue(adicion.columns[2]));
                //         adi += monto
                //     }
                // }

                //*DISMINUCION ===============================================================================================================================================================
                // const disminucion = search.create({
                //     type: ADI_TRANS_RECORD,
                //     filters:
                //         [
                //             ["custrecord_lh_detalle_cppto_solicitud", "anyof", "2"],
                //             "AND",
                //             ["custrecord_lh_detalle_cppto_estado_aprob", "anyof", "2"],
                //             "AND",
                //             ["custrecord_lh_detalle_cppto_fecha_dis", "within", fdesde, fhasta],
                //             "AND",
                //             ["custrecord_lh_detalle_cppto_partida_dis", "anyof", categoriappto]
                //         ],
                //     columns:
                //         [
                //             search.createColumn({ name: "custrecord_lh_detalle_cppto_partida_dis", label: "Partida a Disminuir" }),
                //             search.createColumn({ name: "custrecord_lh_detalle_cppto_fecha_dis", label: "Fecha a Disminuir" }),
                //             search.createColumn({ name: "custrecord_lh_detalle_cppto_aumento_ppto", label: "Monto" })
                //         ]
                // });
                // let resultCount3 = disminucion.runPaged().count;
                // if (resultCount3 != 0) {
                //     let result = disminucion.run().getRange({ start: 0, end: 900 });
                //     for (let i in result) {
                //         let monto = parseFloat(result[i].getValue(disminucion.columns[2]));
                //         dis += monto
                //     }
                // }

                //*PRESUPUESTO ===============================================================================================================================================================
                // let presupuesto = pre + adi - dis;
                let presupuesto = pre;
                return presupuesto;
            },

            getReservado: (fdesde, fhasta, categoriappto) => {
                let reservado = 0;
                let reservadoSearch = search.load({ id: RESERVADO_SEARCH });
                let filters1 = reservadoSearch.filters;
                const filterOne = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [fdesde, fhasta] });
                filters1.push(filterOne);
                const filterThree = search.createFilter({ name: 'custcol_lh_ppto_flag', operator: search.Operator.ANYOF, values: categoriappto });
                filters1.push(filterThree);

                let searchResultCount = reservadoSearch.runPaged().count;
                if (searchResultCount != 0) {
                    let result = reservadoSearch.run().getRange({ start: 0, end: 1 });
                    reservado = parseFloat(result[0].getValue(reservadoSearch.columns[1]));
                }
                return reservado.toFixed(2);
            },

            getComprometido: (fdesde, fhasta, categoriappto) => {
                let comprometido = 0;
                // let comprometidoSearch = search.create({
                //     type: "purchaseorder",
                //     filters:
                //         [
                //             ["type", "anyof", "PurchOrd"],
                //             "AND",
                //             ["custcol_lh_approval_status", "anyof", "2"],
                //             "AND",
                //             ["formulanumeric: {quantity} - {quantitybilled}", "greaterthan", "0"],
                //             "AND",
                //             ["custcol_lh_ppto_flag", "anyof", categoriappto],
                //             "AND",
                //             ['trandate', 'within', fdesde, fhasta]
                //         ],
                //     columns:
                //         [
                //             search.createColumn({
                //                 name: "custcol_lh_ppto_flag",
                //                 summary: "GROUP",
                //                 label: "Categoría de Presupuesto"
                //             }),
                //             search.createColumn({
                //                 name: "formulacurrency",
                //                 summary: "SUM",
                //                 formula: "DECODE({currency.symbol}, 'MXN', NVL({fxrate},0)/20,'COP',NVL({fxrate},0)/1,NVL({fxrate},0)*({quantity}-{quantitybilled}))",
                //                 label: "Formula (Currency)"
                //             })
                //         ]
                // });

                let comprometidoSearch = search.load({ id: COMPROMETIDO_SEARCH });
                let filters2 = comprometidoSearch.filters;
                const filterFive = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [fdesde, fhasta] });
                filters2.push(filterFive);
                const filterSix = search.createFilter({ name: 'custcol_lh_ppto_flag', operator: search.Operator.ANYOF, values: categoriappto });
                filters2.push(filterSix);

                let searchResultCount = comprometidoSearch.runPaged().count;
                //log.debug('CountCom', searchResultCount);
                if (searchResultCount != 0) {
                    let result = comprometidoSearch.run().getRange({ start: 0, end: 1 });
                    comprometido = parseFloat(result[0].getValue(comprometidoSearch.columns[1]));
                }
                return comprometido.toFixed(2);
            },

            getEjecutado: (fdesde, fhasta, categoriappto) => {
                let ejecutado = 0;
                // let ejecutadoSearch = search.create({
                //     type: "transaction",
                //     filters:
                //         [
                //             [
                //                 [
                //                     ["account.custrecordlh_aplica_ppto", "is", "T"], "AND", ["type", "anyof", "Journal"]],
                //                 "OR",
                //                 [
                //                     ["approvalstatus", "anyof", "2"], "AND", ["type", "anyof", "VendBill", "ExpRept"]],
                //                 "OR",
                //                 [
                //                     ["type", "anyof", "VendCred"]],
                //                 "AND",
                //                 ["memorized", "is", "F"],
                //                 "AND",
                //                 ["formulanumeric: NVL({debitamount},0) + NVL({creditamount},0)", "greaterthan", "0"],
                //                 "AND",
                //                 ["posting", "is", "T"],
                //                 "AND",
                //                 ["formulatext: NVL({account},'X')", "isnot", "X"]
                //             ],
                //             "AND",
                //             ["custcol_lh_ppto_flag", "anyof", categoriappto],
                //             "AND",
                //             ['trandate', 'within', fdesde, fhasta]

                //         ],
                //     columns:
                //         [
                //             search.createColumn({
                //                 name: "custcol_lh_ppto_flag",
                //                 summary: "GROUP",
                //                 label: "Categoría de Presupuesto"
                //             }),
                //             search.createColumn({
                //                 name: "formulacurrency",
                //                 summary: "SUM",
                //                 formula: "DECODE({currency.symbol}, 'MXN', (NVL({debitamount},0)-NVL({creditamount},0)) / 20, 'COP',  (NVL({debitamount},0)-NVL({creditamount},0)) / 1, (NVL({debitamount},0)-NVL({creditamount},0))/ 1)* DECODE({accounttype}, 'Equity', -1, 'Income',  -1, 'Other Income', -1, 'Accounts Payable', -1, 'Credit Card', -1, 'Deferred Revenue', -1, 'Long Term Liability', -1, 'Other Current Liability', -1, 1)",
                //                 label: "Formula (Currency)"
                //             })
                //         ]
                // });


                // var ejecutadoSearch = search.create({
                //     type: "transaction",
                //     filters:
                //         [
                //             [
                //                 [["account.custrecordlh_aplica_ppto", "is", "T"], "AND", ["type", "anyof", "Journal"], "AND", ["custbody_ts_tipo_de_cambio_presupuesto", "isnotempty", ""]], "OR", [["approvalstatus", "anyof", "2"], "AND", ["custbody_ts_tipo_de_cambio_presupuesto", "isnotempty", ""], "AND", ["type", "anyof", "VendBill", "ExpRept"]], "OR", [["type", "anyof", "VendCred"], "AND", ["custbody_ts_tipo_de_cambio_presupuesto", "isnotempty", ""]], "AND", ["memorized", "is", "F"], "AND", ["formulanumeric: NVL({debitamount},0) + NVL({creditamount},0)", "greaterthan", "0"], "AND", ["posting", "is", "T"], "AND", ["formulatext: NVL({account},'X')", "isnot", "X"]
                //             ],
                //             "AND",
                //             ["custcol_lh_ppto_flag", "anyof", categoriappto],
                //             "AND",
                //             ['trandate', 'within', fdesde, fhasta]
                //         ],
                //     columns:
                //         [
                //             search.createColumn({
                //                 name: "custcol_lh_ppto_flag",
                //                 summary: "GROUP",
                //                 label: "Categoría de Presupuesto"
                //             }),
                //             search.createColumn({
                //                 name: "formulacurrency",
                //                 summary: "SUM",
                //                 formula: "NVL({fxrate},0)/{custbody_ts_tipo_de_cambio_presupuesto}*DECODE({accounttype}, 'Equity', -1, 'Income',  -1, 'Other Income', -1, 'Accounts Payable', -1, 'Credit Card', -1, 'Deferred Revenue', -1, 'Long Term Liability', -1, 'Other Current Liability', -1, 1)",
                //                 label: "Formula (Currency)"
                //             })
                //         ]
                // });
                //  var searchResultCount = journalentrySearchObj.runPaged().count;
                //  log.debug("journalentrySearchObj result count",searchResultCount);
                //  journalentrySearchObj.run().each(function(result){
                //     // .run().each has a limit of 4,000 results
                //     return true;
                //  });

                // log.debug('categoriappto', categoriappto);
                let ejecutadoSearch = search.load({ id: EJECUTADO_SEARCH });
                let filters = ejecutadoSearch.filters;
                const filterTwo = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [fdesde, fhasta] });
                filters.push(filterTwo);
                const filterFour = search.createFilter({ name: 'custcol_lh_ppto_flag', operator: search.Operator.ANYOF, values: categoriappto });
                filters.push(filterFour);

                let searchResultCount = ejecutadoSearch.runPaged().count;
                //log.debug('CountEje', searchResultCount);
                if (searchResultCount != 0) {
                    let result = ejecutadoSearch.run().getRange({ start: 0, end: 10 });
                    //log.debug('Result', result);
                    ejecutado = parseFloat(result[0].getValue(ejecutadoSearch.columns[1]));
                }
                return ejecutado.toFixed(2);
            },

            applyIncrease: (fecha, amount, partida) => {
                let success = 0;
                let year = fecha.split('/')[2];
                let month = parseInt(fecha.split('/')[1]);
                month = month <= 9 ? '0' + month : month;
                const increase = search.create({
                    type: CATEGORIA_PERIODO_RECORD,
                    filters:
                        [
                            ["custrecord_lh_detalle_cppto_status", "anyof", "1"],
                            "AND",
                            ["custrecord_lh_detalle_cppto_categoria", "anyof", partida],
                            "AND",
                            ["custrecord_lh_detalle_cppto_anio.name", "haskeywords", year]
                        ],
                    columns:
                        [
                            'internalid'
                        ]
                });
                let resultCount = increase.runPaged().count;
                if (resultCount != 0) {
                    let result = increase.run().getRange({ start: 0, end: 1 });
                    let internalid = result[0].getValue(increase.columns[0]);
                    let recordLoad = record.load({ type: CATEGORIA_PERIODO_RECORD, id: internalid, isDynamic: true });
                    let presupuestado = parseFloat(recordLoad.getValue({ fieldId: 'custrecord_lh_detalle_cppto_' + month }));
                    let suma = presupuestado + amount;
                    recordLoad.setValue({ fieldId: 'custrecord_lh_detalle_cppto_' + month, value: suma });
                    recordLoad.save();
                    success = 1;
                }
                return success;
            },

            applyDecrease: (fecha, amout, partida) => {
                let success = 0;
                let year = fecha.split('/')[2];
                let month = parseInt(fecha.split('/')[1]);
                month = month <= 9 ? '0' + month : month;
                const decrease = search.create({
                    type: CATEGORIA_PERIODO_RECORD,
                    filters:
                        [
                            ["custrecord_lh_detalle_cppto_status", "anyof", "1"],
                            "AND",
                            ["custrecord_lh_detalle_cppto_categoria", "anyof", partida],
                            "AND",
                            ["custrecord_lh_detalle_cppto_anio.name", "haskeywords", year]
                        ],
                    columns:
                        [
                            'internalid'
                        ]
                });
                let resultCount = decrease.runPaged().count;
                if (resultCount != 0) {
                    let result = decrease.run().getRange({ start: 0, end: 1 });
                    let internalid = result[0].getValue(decrease.columns[0]);
                    //alert('Partida Decrease: ' + month);
                    let recordLoad = record.load({ type: CATEGORIA_PERIODO_RECORD, id: internalid, isDynamic: true });
                    let presupuestado = parseFloat(recordLoad.getValue({ fieldId: 'custrecord_lh_detalle_cppto_' + month }));
                    let suma = presupuestado - amout;
                    recordLoad.setValue({ fieldId: 'custrecord_lh_detalle_cppto_' + month, value: suma });
                    recordLoad.save();
                    success = 1;
                }
                return success;
            },

            getQuaterly: (tempo, year) => {
                let from = '';
                let to = '';

                switch (tempo) {
                    case 0:
                        from = "1/1/" + year;
                        to = "31/3/" + year;
                        break;
                    case 1:
                        from = "1/4/" + year;
                        to = "30/6/" + year;
                        break;
                    case 2:
                        from = "1/7/" + year;
                        to = "30/9/" + year;
                        break;
                    case 3:
                        from = "1/10/" + year;
                        to = "31/12/" + year;
                        break;
                    default:
                        from = 0;
                        to = 0;
                        break;
                }

                if (from == 0 || to == 0) {
                    alert('Validar temporalidad, fechas.');
                    return false;
                }

                return {
                    'fdesde': from,
                    'fhasta': to
                }
                // if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
                //     from = "1/" + month + "/" + year;
                //     to = "31/" + month + "/" + year;
                // } else if (month == 4 || month == 6 || month == 9 || month == 11) {
                //     from = "1/" + month + "/" + year;
                //     to = "30/" + month + "/" + year;
                // } else if (month == 2) {
                //     from = "1/" + month + "/" + year;
                //     to = "28/" + month + "/" + year;
                // }

                // if (from == 0 || to == 0) {
                //     alert('Validar temporalidad, fechas.');
                //     return false;
                // }

                // return {
                //     'fdesde': from,
                //     'fhasta': to
                // }
            },

            getMonthly: (month, year) => {
                let from = 0;
                let to = 0;

                if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
                    from = "1/" + month + "/" + year;
                    to = "31/" + month + "/" + year;
                } else if (month == 4 || month == 6 || month == 9 || month == 11) {
                    from = "1/" + month + "/" + year;
                    to = "30/" + month + "/" + year;
                } else if (month == 2) {
                    from = "1/" + month + "/" + year;
                    to = "28/" + month + "/" + year;
                }

                if (from == 0 || to == 0) {
                    alert('Validar temporalidad, fechas.');
                    return false;
                }

                return {
                    'fdesde': from,
                    'fhasta': to
                }
            },

            sysDate: (fecha) => {
                let date = new Date(fecha);
                let month = date.getMonth() + 1; // jan = 0
                let year = date.getFullYear();
                month = month <= 9 ? '0' + month : month;

                return {
                    month: month,
                    year: year
                }
            },

            getConfig: () => {
                let temporalidad = 0;
                let objSearch = search.load({ id: CONFIG_PPTO_SEARCH });
                let filters = objSearch.filters;
                // const filterOne = search.createFilter({ name: 'custrecord_lh_cp_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
                // filters.push(filterOne);
                const filterThree = search.createFilter({ name: 'custrecord_lh_cp_flujo_aprobacion', operator: search.Operator.IS, values: true });
                filters.push(filterThree);

                let searchResultCount = objSearch.runPaged().count;
                if (searchResultCount != 0) {
                    let resultConfig = objSearch.run().getRange({ start: 0, end: 1 });
                    temporalidad = resultConfig[0].getValue({ name: "custrecord_lh_cp_temporalidad" });
                    // let desviacion = resultConfig[0].getValue({ name: "custrecord_lh_cp_desviacion_ppto" });
                    // let nivelControl = resultConfig[0].getValue({ name: "custrecord_lh_cp_nivel_control" });
                    // return {
                    //     temporalidad: temporalidad,
                    //     desviacion: desviacion,
                    //     nivelControl: nivelControl
                    // } 
                }
                return temporalidad;
            },

            getTipoCambio: (symbol) => {
                let exchangeRate = 1;
                if (symbol == COP || symbol == MXN) {
                    let objSearch = search.load({ id: TIPO_CAMBIO_SEARCH });
                    let filters = objSearch.filters;
                    //const symbolFilter = search.createFilter({ name: 'symbol', join: 'custrecord_lh_tc_moneda', operator: 'startswith', values: symbol });
                    const symbolFilter = search.createFilter({ name: 'custrecord_lh_tc_moneda', operator: 'anyof', values: symbol });
                    filters.push(symbolFilter);
                    // const filterTwo = search.createFilter({ name: 'custrecord_lh_tc_periodo', operator: search.Operator.ANYOF, values: internalidPeriod });
                    // filters.push(filterTwo);
                    let searchResultCount = objSearch.runPaged().count;
                    if (searchResultCount != 0) {
                        let result = objSearch.run().getRange({ start: 0, end: 5 });
                        //log.debug('result', result);
                        for (let i in result) {
                            //let symbol = result[i].getValue({ name: "symbol", join: "CUSTRECORD_LH_TC_MONEDA", summary: "GROUP" });
                            exchangeRate = parseFloat(result[i].getValue({ name: "custrecord_lh_tc_tipo_cambio", summary: "GROUP" }));
                        }
                        return { exchangeRate: exchangeRate }
                    } else {
                        return { exchangeRate: exchangeRate }
                    }
                } else {
                    return { exchangeRate: exchangeRate }
                }
            },

            getPresupuestado2: (fdesde, fhasta, categoriappto) => {
                let pre = 0;
                let year = fdesde.split('/')[2];
                let from = parseInt(fdesde.split('/')[1]);
                let to = parseInt(fhasta.split('/')[1]);
                //*PRESUPUESTADO =============================================================================================================================================================
                const presupuestado = search.create({
                    type: CATEGORIA_PERIODO_RECORD,
                    filters:
                        [
                            ["custrecord_lh_detalle_cppto_status", "anyof", "1"],
                            "AND",
                            ["custrecord_lh_detalle_cppto_categoria", "anyof", categoriappto],
                            "AND",
                            ["custrecord_lh_detalle_cppto_anio.name", "haskeywords", year]
                        ],
                    columns:
                        [
                            'internalid'
                        ]
                });
                // let resultCount = presupuestado.runPaged().count;
                // if (resultCount != 0) {
                //     let result = presupuestado.run().getRange({ start: 0, end: 1 });
                //     let internalid = result[0].getValue(presupuestado.columns[0]);
                //     let recordLoad = record.load({ type: CATEGORIA_PERIODO_RECORD, id: internalid, isDynamic: true });
                //     let from = parseInt(fdesde.split('/')[1]);
                //     let to = parseInt(fhasta.split('/')[1]);
                //     //console.log('Fechas',from + '-' + to);
                //     for (let i = from; i <= to; i++) {
                //         let mes = i <= 9 ? `0${i}` : `${i}`;
                //         //console.log('I', i);
                //         let monto = parseFloat(recordLoad.getValue('custrecord_lh_detalle_cppto_' + i));
                //         pre += monto
                //     }
                // }
                // let presupuesto = pre;


                // let pagedData = reservado.runPaged({ pageSize: 1000 });
                // if (pagedData.count <= 4000) {
                //     presupuestado.run().each(result => {
                //         let categoriaId = result.getValue("custrecord_lh_detalle_cppto_categoria");
                //         if (presupuestoResultJson[categoriaId] === undefined) presupuestoResultJson[categoriaId] = 0;
                //         for (let i = from; i <= to; i++) {
                //             let mes = i <= 9 ? `0${i}` : `${i}`;
                //             let monto = parseFloat(recordLoad.getValue('custrecord_lh_detalle_cppto_' + mes));
                //             pre += monto
                //         }
                //         return true;
                //     });
                // } else {
                //     pagedData.pageRanges.forEach(pageRange => {
                //         page = pagedData.fetch({ index: pageRange.index });
                //         page.data.forEach(result => {
                //             let categoriaId = result.getValue("custrecord_lh_detalle_cppto_categoria");
                //             if (presupuestoResultJson[categoriaId] === undefined) presupuestoResultJson[categoriaId] = 0;
                //             for (let i = from; i <= to; i++) {
                //                 let mes = i <= 9 ? `0${i}` : `${i}`;
                //                 let monto = parseFloat(recordLoad.getValue('custrecord_lh_detalle_cppto_' + mes));
                //                 pre += monto
                //             }
                //         });
                //     });
                // }
                // let presupuesto = pre;
                return presupuesto;
            },

        });
    });