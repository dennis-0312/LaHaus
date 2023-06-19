/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search', 'N/ui/dialog', 'N/runtime', '../Reporte Presupuestal/controller/TS_Script_Controller'], (currentRecord, search, dialog, runtime, _controller) => {
    const CONTROL_PRESUPUESTAL_RESERVADO_PO = 'customsearch_control_ppto_reservado_po'; //Control Presupuestal RESERVADO PO - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_RESERVADO_ER = 'customsearch_control_ppto_reservado_er'; //Control Presupuestal RESERVADO ER - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_COMPROMETIDO = 'customsearch_control_ppto_comprometido'; //Control Presupuestal COMPROMETIDO - PRODUCCIÓN
    const CONTROL_PRESUPUESTAL_EJECUTADO = 'customsearch_control_ppto_ejecutado'; //Control Presupuestal EJECUTADO - PRODUCCIÓN
    const TIPO_CAMBIO_SEARCH = 'customsearch_co_tipo_cambio'; //CO Tipo Cambio Search - CP PRODUCCION
    const CATEGORIA_PPTO_PERIODOS = 'customsearch_co_categoria_ppto_periodos'; //CO Categoria Presupuesto Periodos Search - CP PRODUCCION
    const PRESUPUESTO_TRIMESTRAL = ''
    const PARTIDA_PRESUPUESTAL_SEARCH = 'customsearch_partida_presupuestal'; //Partida Presupuestal - PRODUCCION
    const arregloTrimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
    const anual = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const TEMPORALIDAD_MENSUAL = 1;
    const TEMPORALIDAD_TRIMESTRAL = 2;
    const TEMPORALIDAD_ANUAL = 3;
    const DESVIACION_ADVERTENCIA = 1;
    const DESVIACION_BLOQUEO = 2;
    const CECO_NIVEL_CONTROL = 1;
    const CUENTA_NIVEL_CONTROL = 2;
    const CATEGORIA_NIVEL_CONTROL = 3;
    const CURRENCY_US_SOLES = 2;
    const PURCHASE_ORDER = 'purchaseorder';
    const EXPENSE_REPORT = 'expensereport';
    const EXPENSE_REQUISITION = 'purchaserequisition';
    const PAYMENT_ORDER = 'custompurchasepayment_order';

    let typeMode = '';
    let cop = 0;
    let mxn = 0;
    let generalSolicitud = new Array();
    let maestros = new Array();
    // const Dennis = 27160;

    const pageInit = (scriptContext) => {
        typeMode = scriptContext.mode; //!Importante, no borrar.
        console.log(scriptContext.currentRecord.type);
    }




    const validateLine = (scriptContext) => {
        const objRecord = scriptContext.currentRecord;

        const sublistName = scriptContext.sublistId;
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            let json = new Array();
            let rangeDates = new Array();
            let msgCriterio = '';
            let msgVacio = '';
            let list = '';
            let quantity = 0;
            let rate = 0;
            let disponible = 0;
            let solicitud = 0;
            let temporalidad = 1;

            if (temporalidad != 0) {
                //let status = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_approval_status' });
                //!Si hay que hacer un ajuste para ingresar órdenes de compras retroactivas aquí va la lógica usando el quantityBilled si mayor a 1 es ejecutado
                // if (status == 1) {
                let sublistId = "item";
                if (scriptContext.currentRecord.type == EXPENSE_REPORT) {
                    sublistId = "expense";
                }
                let line = objRecord.getCurrentSublistIndex({ sublistId: sublistId });
                let unidad_territorial = parseInt(objRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'location' }));
                console.log(unidad_territorial);
                if (isNaN(unidad_territorial)) {
                    alert('No tiene unidad territorial .');
                    return false;
                }
                let unidad_funcional = parseInt(objRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'department' }));
                if (isNaN(unidad_funcional)) {
                    alert('No tiene unidad funcional .');
                    return false;
                }
                let unidad_tematica = parseInt(objRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'class' }));
                if (isNaN(unidad_tematica)) {
                    alert('No tiene unidad Eje de Intervención .');
                    return false;
                }
                let desviacion = objRecord.getValue('custbody_lh_desviacion_flag');
                let trandate = objRecord.getValue({ fieldId: 'trandate' });
                date = _controller.sysDate(trandate); //! sysDate (FUNCTION)
                let month = date.month;
                let year = date.year
                console.log(1);
                if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
                    //!const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
                    for (let i in arregloTrimestre) {
                        let bloque = arregloTrimestre[i].includes(month.toString());
                        if (bloque == true) {
                            tempo = parseInt(i);
                            break;
                        }
                    }
                    rangeDates = _controller.getQuaterly(tempo, year);
                } else if (temporalidad == TEMPORALIDAD_MENSUAL) {
                    rangeDates = _controller.getMonthly(parseInt(month), year);

                }

                console.log('rangeDates ' + rangeDates.fhasta);



                if (scriptContext.currentRecord.type == PURCHASE_ORDER) {
                    list = 'item';

                    let proyecto = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'customer' });
                    let baseImponible = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'taxrate1' });
                    //console.log('IMP', baseImponible);
                    baseImponible = parseFloat(baseImponible) / 100;
                    let vendorname = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'vendorname' });
                    vendorname = vendorname.split('-')[0];
                    vendorname = vendorname.trim();
                    vendorname = vendorname.replace(/[^0-9]+/g, "")

                    console.log('Cuenta: ' + vendorname);
                    let cuentaSearch = search.create({
                        type: "account",
                        filters:
                            [
                                ["number", "startswith", vendorname],
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" }),
                            ]
                    });
                    let resultado = cuentaSearch.run().getRange({ start: 0, end: 1 });
                    cuenta = resultado[0].getValue(cuentaSearch.columns[0]);
                    objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_cuenta', value: cuenta });
                    console.log('Cuenta: ' + cuenta);
                    //cuenta = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_cuenta' });
                    let exchangerate = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'exchangerate' });
                    if (proyecto.length == 0) {
                        alert('No tiene proyecto.');
                        return false;
                    }
                    if (cuenta.length == 0) {
                        alert('No tiene cuenta.');
                        return false;
                    }
                    const presupuestado = search.create({
                        type: "customrecord_lh_categoria_presupuesto",
                        filters:
                            [
                                ["custrecord_lh_cp_unidad_territorial", "anyof", unidad_territorial],
                                "AND",
                                ["custrecord_lh_cp_eje_intervencion", "anyof", unidad_tematica],
                                "AND",
                                ["custrecord_lh_cp_unidad_funcional", "anyof", unidad_funcional],
                                "AND",
                                ["custrecord_lh_cp_proyecto", "anyof", proyecto],
                                "AND",
                                ["custrecord_lh_cp_cuenta", "anyof", cuenta]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" }),
                                search.createColumn({ name: "custrecord_lh_cp_cuenta", label: "name" }),
                            ]
                    });

                    let resultCount = presupuestado.runPaged().count;

                    if (resultCount != 0) {
                        let result = presupuestado.run().getRange({ start: 0, end: 1 });
                        //console.log('ReservadoPO', JSON.stringify(resultPO));
                        criterioControl = result[0].getValue(presupuestado.columns[0]);

                        //console.log(categoria + ' - ' + presupuesto);
                    } else {
                        alert("No cuenta con una Categoria de Presupuesto valida");
                        return false;
                    }

                    quantity = parseInt(objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' }));
                    let quantityBilled = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantitybilled' });
                    quantityBilled = typeof quantityBilled == 'undefined' ? 0 : parseInt(quantityBilled);
                    quantityBilled = isNaN(quantityBilled) == true ? 0 : quantityBilled;
                    //rate = parseFloat(objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'grossamt' }));
                    rate = parseFloat(objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'rate' }));

                    generalSolicitud[line] = parseFloat((((quantity - quantityBilled) * rate) + ((quantity - quantityBilled) * rate) * baseImponible).toFixed(2));
                    maestros[line] = criterioControl;
                    // solicitud = generalSolicitud.reduce((a, b) => a + b, 0);
                    for (let i = 0; i < maestros.length; i++) {
                        if (maestros[i] == criterioControl) {
                            solicitud = solicitud + generalSolicitud[i]
                        }
                    }

                    console.log('solicitud:' + solicitud);
                    json = [criterioControl, quantity, quantityBilled, rate, status];

                    //disponible = _controller.getPresupuestado(rangeDates.fdesde, rangeDates.fhasta, criterioControl);
                    disponible = getDisponible(rangeDates, criterioControl, objRecord, trandate); //! getDisponible (FUNCTION)
                    console.log('Disponible:' + disponible);
                    let resta = disponible - solicitud;
                    console.log('Resta:' + resta);
                }

                if (scriptContext.currentRecord.type == EXPENSE_REPORT) {
                    list = 'expense';
                    let proyecto = objRecord.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'customer' });
                    let cuenta = objRecord.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'expenseaccount' });
                    let exchangerate = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'exchangerate' });
                    if (proyecto.length == 0) {
                        alert('No tiene proyecto.');
                        return false;
                    }
                    if (cuenta.length == 0) {
                        alert('No tiene cuenta.');
                        return false;
                    }
                    const presupuestado = search.create({
                        type: "customrecord_lh_categoria_presupuesto",
                        filters:
                            [
                                ["custrecord_lh_cp_unidad_territorial", "anyof", unidad_territorial],
                                "AND",
                                ["custrecord_lh_cp_eje_intervencion", "anyof", unidad_tematica],
                                "AND",
                                ["custrecord_lh_cp_unidad_funcional", "anyof", unidad_funcional],
                                "AND",
                                ["custrecord_lh_cp_proyecto", "anyof", proyecto],
                                "AND",
                                ["custrecord_lh_cp_cuenta", "anyof", cuenta]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" }),
                                search.createColumn({ name: "custrecord_lh_cp_cuenta", label: "name" }),
                            ]
                    });

                    let resultCount = presupuestado.runPaged().count;

                    if (resultCount != 0) {
                        let result = presupuestado.run().getRange({ start: 0, end: 1 });
                        //console.log('ReservadoPO', JSON.stringify(resultPO));
                        criterioControl = result[0].getValue(presupuestado.columns[0]);

                        //console.log(categoria + ' - ' + presupuesto);
                    } else {
                        alert("No cuenta con una Categoria de Presupuesto valida");
                        return false;
                    }
                    generalSolicitud[line] = parseFloat(objRecord.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'grossamt' }));
                    console.log('solicitudua0: ' + generalSolicitud[line]);
                    maestros[line] = criterioControl;
                    // solicitud = generalSolicitud.reduce((a, b) => a + b, 0);
                    for (let i = 0; i < maestros.length; i++) {
                        if (maestros[i] == criterioControl) {
                            solicitud = solicitud + generalSolicitud[i]
                        }
                    }
                    //solicitud = parseFloat(objRecord.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'grossamt' }));
                    console.log('solicitudua:' + solicitud);

                    disponible = getDisponible(rangeDates, criterioControl, objRecord, trandate); //! getDisponible (FUNCTION)
                    console.log('Disponible:' + disponible);
                    let resta = disponible - solicitud;
                    console.log('Resta:' + resta);
                }

                if (scriptContext.currentRecord.type == EXPENSE_REQUISITION) {
                    list = 'item';
                    let proyecto = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'customer' });
                    let vendorname = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'vendorname' });
                    vendorname = vendorname.split('-')[0];
                    vendorname = vendorname.trim();
                    vendorname = vendorname.replace(/[^0-9]+/g, "")

                    console.log('Cuenta: ' + vendorname);
                    let cuentaSearch = search.create({
                        type: "account",
                        filters:
                            [
                                ["number", "startswith", vendorname],
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" }),
                            ]
                    });
                    let resultado = cuentaSearch.run().getRange({ start: 0, end: 1 });
                    cuenta = resultado[0].getValue(cuentaSearch.columns[0]);
                    objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_cuenta', value: cuenta });
                    console.log('Cuenta: ' + cuenta);
                    if (proyecto.length == 0) {
                        alert('No tiene proyecto.');
                        return false;
                    }
                    if (cuenta.length == 0) {
                        alert('No tiene cuenta.');
                        return false;
                    }
                    const presupuestado = search.create({
                        type: "customrecord_lh_categoria_presupuesto",
                        filters:
                            [
                                ["custrecord_lh_cp_unidad_territorial", "anyof", unidad_territorial],
                                "AND",
                                ["custrecord_lh_cp_eje_intervencion", "anyof", unidad_tematica],
                                "AND",
                                ["custrecord_lh_cp_unidad_funcional", "anyof", unidad_funcional],
                                "AND",
                                ["custrecord_lh_cp_proyecto", "anyof", proyecto],
                                "AND",
                                ["custrecord_lh_cp_cuenta", "anyof", cuenta]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" }),
                                search.createColumn({ name: "custrecord_lh_cp_cuenta", label: "name" }),
                            ]
                    });

                    let resultCount = presupuestado.runPaged().count;

                    if (resultCount != 0) {
                        let result = presupuestado.run().getRange({ start: 0, end: 1 });
                        //console.log('ReservadoPO', JSON.stringify(resultPO));
                        criterioControl = result[0].getValue(presupuestado.columns[0]);

                        //console.log(categoria + ' - ' + presupuesto);
                    } else {
                        alert("No cuenta con una Categoria de Presupuesto valida");
                        return false;
                    }
                    generalSolicitud[line] = parseFloat(objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'estimatedamount' }));
                    maestros[line] = criterioControl;
                    // solicitud = generalSolicitud.reduce((a, b) => a + b, 0);
                    for (let i = 0; i < maestros.length; i++) {
                        if (maestros[i] == criterioControl) {
                            solicitud = solicitud + generalSolicitud[i]
                        }
                    }
                    console.log('solicitud:' + solicitud);
                    disponible = getDisponible(rangeDates, criterioControl, objRecord, trandate); //! getDisponible (FUNCTION)
                    console.log('Disponible:' + disponible);
                    let resta = disponible - solicitud;
                    console.log('Resta:' + resta);
                }

                if (scriptContext.currentRecord.type == PAYMENT_ORDER) {
                    list = 'item';
                    let proyecto = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'customer' });
                    let vendorname = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'vendorname' });
                    vendorname = vendorname.split('-')[0];
                    vendorname = vendorname.trim();
                    vendorname = vendorname.replace(/[^0-9]+/g, "")

                    console.log('Cuenta: ' + vendorname);
                    let cuentaSearch = search.create({
                        type: "account",
                        filters:
                            [
                                ["number", "startswith", vendorname],
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" }),
                            ]
                    });
                    let resultado = cuentaSearch.run().getRange({ start: 0, end: 1 });
                    cuenta = resultado[0].getValue(cuentaSearch.columns[0]);
                    objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_cuenta', value: cuenta });
                    console.log('Cuenta: ' + cuenta);
                    let exchangerate = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'exchangerate' });
                    if (proyecto.length == 0) {
                        alert('No tiene proyecto.');
                        return false;
                    }
                    if (cuenta.length == 0) {
                        alert('No tiene cuenta.');
                        return false;
                    }
                    const presupuestado = search.create({
                        type: "customrecord_lh_categoria_presupuesto",
                        filters:
                            [
                                ["custrecord_lh_cp_unidad_territorial", "anyof", unidad_territorial],
                                "AND",
                                ["custrecord_lh_cp_eje_intervencion", "anyof", unidad_tematica],
                                "AND",
                                ["custrecord_lh_cp_unidad_funcional", "anyof", unidad_funcional],
                                "AND",
                                ["custrecord_lh_cp_proyecto", "anyof", proyecto],
                                "AND",
                                ["custrecord_lh_cp_cuenta", "anyof", cuenta]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID" }),
                                search.createColumn({ name: "custrecord_lh_cp_cuenta", label: "name" }),
                            ]
                    });

                    let resultCount = presupuestado.runPaged().count;

                    if (resultCount != 0) {
                        let result = presupuestado.run().getRange({ start: 0, end: 1 });
                        //console.log('ReservadoPO', JSON.stringify(resultPO));
                        criterioControl = result[0].getValue(presupuestado.columns[0]);

                        //console.log(categoria + ' - ' + presupuesto);
                    } else {
                        alert("No cuenta con una Categoria de Presupuesto valida");
                        return false;
                    }
                    generalSolicitud[line] = parseFloat(objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'amount' }));
                    maestros[line] = criterioControl;
                    // solicitud = generalSolicitud.reduce((a, b) => a + b, 0);
                    for (let i = 0; i < maestros.length; i++) {
                        if (maestros[i] == criterioControl) {
                            solicitud = solicitud + generalSolicitud[i]
                        }
                    }
                    console.log();
                    disponible = getDisponible(rangeDates, criterioControl, objRecord, trandate); //! getDisponible (FUNCTION)
                    console.log('solicitud:' + solicitud);
                    console.log('Disponible:' + disponible);
                    let resta = disponible - solicitud;
                    console.log('Resta:' + resta);
                }

                try {
                    if (sublistName === list) {
                        console.log('lleno: ' + solicitud);
                        console.log('disponible2: ' + disponible);
                        if (disponible >= solicitud) {
                            console.log('Tiene ppto');
                            let lh_rate = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_rate' });
                            let lh_cantidad = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_ppto_flag_cantidad' });
                            if (lh_rate < rate || (lh_cantidad < quantity)) {
                                objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_approval_status', value: 1 });
                                objRecord.setValue({ fieldId: 'approvalstatus', value: 1 });

                            }
                            objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_rate', value: rate });
                            objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_ppto_flag_cantidad', value: quantity });

                            return true;
                        } else {
                            alert('No tiene Presupuesto Asignado.');
                            return false;

                        }
                    } return true
                } catch (error) {
                    console.log(error);
                    alert(error);
                    return false;
                }

                // }

            }
            return true;
        }
        return true;
    }


    const getDisponible = (rangeDates, criterioControl, objRecord, trandate) => {
        let tempo = 0;
        let list = '';

        //try {

        console.log(rangeDates);
        let presupuestado = _controller.getPresupuestado(rangeDates.fdesde, rangeDates.fhasta, criterioControl);
        console.log('presupuestado: ' + presupuestado);
        let reservado = _controller.getReservado(rangeDates.fdesde, rangeDates.fhasta, criterioControl);
        console.log('reservado: ' + reservado);
        let comprometido = _controller.getComprometido(rangeDates.fdesde, rangeDates.fhasta, criterioControl);
        console.log('comprometido: ' + comprometido);
        let ejecutado = _controller.getEjecutado(rangeDates.fdesde, rangeDates.fhasta, criterioControl);
        console.log('ejecutado: ' + ejecutado);
        let disponible = parseFloat(presupuestado) - (parseFloat(reservado) + parseFloat(comprometido) + parseFloat(ejecutado));


        // if (objRecord.type == PURCHASE_ORDER) {
        //     list = 'item';
        // } else {
        //     list = 'expense';
        // }
        list = objRecord.type == EXPENSE_REPORT ? 'expense' : 'item';
        objRecord.setCurrentSublistValue({ sublistId: list, fieldId: 'custcol_lh_cp_partida_presupuestal', value: criterioControl });




        return disponible;
        //} catch (error) {
        //  alert(error);
        //}
    }


    const getPresupuesto = (criterioControl, tempo, year) => {
        let presupuesto = 0;
        let categoria = 0;

        const presupuestado = search.create({
            type: "customrecord_lh_categoriap_periodo",
            filters:
                [
                    ["custrecord_lh_detalle_cppto_status", "anyof", "1"],
                    "AND",
                    ["custrecord_lh_detalle_cppto_categoria", "anyof", criterioControl],
                    "AND",
                    ["custrecord_lh_detalle_cppto_anio.name", "haskeywords", year]
                ],
            columns:
                [
                    search.createColumn({ name: "custrecord_lh_detalle_cppto_categoria", label: "0 Categoría" }),
                    search.createColumn({ name: "custrecord_lh_detalle_cppto_" + tempo, label: "1 Trimestre" }),
                ]
        });

        let resultCount = presupuestado.runPaged().count;

        if (resultCount != 0) {
            let result = presupuestado.run().getRange({ start: 0, end: 1 });
            //console.log('ReservadoPO', JSON.stringify(resultPO));
            categoria = result[0].getValue(presupuestado.columns[0]);
            presupuesto = parseFloat(result[0].getValue(presupuestado.columns[1]));
            //console.log(categoria + ' - ' + presupuesto);
        }

        return {
            categoria: categoria,
            presupuesto: presupuesto,
        }
    }


    const getReservado = (temporalidad, trandate, categoria) => {

        let categoriappto = 0;
        let reservadopo = 0;
        let reservadoer = 0;
        let formulaTemporalidad = '';
        let operator = ''
        let from = '';
        let to = '';

        if (temporalidad == TEMPORALIDAD_MENSUAL) {
            var date = new Date(trandate);
            var primerDia = new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString();
            var ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0).toLocaleDateString();
            formulaTemporalidad = "trandate"
            operator = "within"
        }



        const reservadoPo = search.create({
            type: "purchaseorder",
            filters:
                [
                    ["type", "anyof", "PurchOrd"],
                    "AND",
                    ["approvalstatus", "anyof", "1"],
                    "AND",
                    ["formulanumeric: {quantity} - {quantitybilled}", "greaterthan", "0"],
                    "AND",
                    ["custcol_lh_cp_partida_presupuestal", "anyof", categoria],
                    "AND",
                    // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
                    [formulaTemporalidad, operator, primerDia, ultimoDia]
                ],
            columns:
                [
                    search.createColumn({
                        name: "custcol_lh_cp_partida_presupuestal",
                        summary: "GROUP",
                        label: "0 Categoría de Presupuesto"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "({fxrate}+({fxrate}*{taxitem.rate}/100))*({quantity}-{quantitybilled})",
                        label: "1 Formula (Currency)"
                    })
                ]
        });
        let searchResultCountPO = reservadoPo.runPaged().count;

        if (searchResultCountPO != 0) {
            let resultPO = reservadoPo.run().getRange({ start: 0, end: 1 });
            categoriappto = resultPO[0].getValue(reservadoPo.columns[0]);
            reservadopo = parseFloat(resultPO[0].getValue(reservadoPo.columns[1]));

        } else {
            reservadopo = 0;
        }
        const reservadoRequisition = search.create({
            type: "purchaserequisition",
            filters:
                [

                    ["status", "anyof", "PurchReq:A", "PurchReq:B", "PurchReq:R"],
                    "AND",
                    ["formulanumeric: {quantity} - {quantitybilled}", "greaterthan", "0"],
                    "AND",
                    ["custcol_lh_cp_partida_presupuestal", "anyof", categoria],
                    "AND",
                    // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
                    [formulaTemporalidad, operator, primerDia, ultimoDia]
                ],
            columns:
                [
                    search.createColumn({
                        name: "custcol_lh_cp_partida_presupuestal",
                        summary: "GROUP",
                        label: "0 Categoría de Presupuesto"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "({fxrate})*({quantity}-{quantitybilled})",
                        label: "1 Formula (Currency)"
                    })
                ]
        });
        let searchResultCountRequisition = reservadoRequisition.runPaged().count;
        let resultRequisitionValue;
        if (searchResultCountRequisition != 0) {
            let resultRequisition = reservadoRequisition.run().getRange({ start: 0, end: 1 });
            categoriappto = resultRequisition[0].getValue(reservadoRequisition.columns[0]);
            resultRequisitionValue = parseFloat(resultRequisition[0].getValue(reservadoRequisition.columns[1]));
        } else {
            resultRequisitionValue = 0;
        }


        const reservadoPago = search.create({
            type: "custompurchasepayment_order",
            filters:
                [
                    ["status", "anyof", "CuTrPrch111:A", "CuTrPrch111:B"],
                    "AND",
                    ["formulanumeric: ({quantity} - {quantitybilled})*-1", "greaterthan", "0"],
                    "AND",
                    ["custcol_lh_cp_partida_presupuestal", "anyof", categoria],
                    "AND",
                    // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
                    [formulaTemporalidad, operator, primerDia, ultimoDia]
                ],
            columns:
                [
                    search.createColumn({
                        name: "custcol_lh_cp_partida_presupuestal",
                        summary: "GROUP",
                        label: "Categoría de Presupuesto"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "({fxrate}*{quantity}*-1)",
                        label: "1 Formula (Currency)"
                    })
                ]
        });
        let searchResultCountpago = reservadoPago.runPaged().count;

        let resultpagoValue;
        if (searchResultCountpago != 0) {
            let resultpago = reservadoPago.run().getRange({ start: 0, end: 1 });
            categoriappto = resultpago[0].getValue(reservadoPago.columns[0]);
            resultpagoValue = parseFloat(resultpago[0].getValue(reservadoPago.columns[1]));

        } else {
            resultpagoValue = 0;
        }

        const reservadoEr = search.create({
            type: "expensereport",
            filters:
                [
                    ["approvalstatus", "anyof", "1", "3"],
                    "AND",
                    ["type", "anyof", "ExpRept"],
                    "AND",
                    ["memorized", "is", "F"],
                    "AND",
                    ["formulanumeric: NVL({debitamount},0) + NVL({creditamount},0)", "greaterthan", "0"],
                    "AND",
                    ["posting", "is", "F"],
                    "AND",
                    ["formulatext: NVL({account},'X')", "isnot", "X"],
                    "AND",
                    ["custcol_lh_cp_partida_presupuestal", "anyof", categoria],
                    // "AND",
                    // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
                    "AND",
                    [formulaTemporalidad, operator, primerDia, ultimoDia]
                ],
            columns:
                [
                    search.createColumn({
                        name: "custcol_lh_cp_partida_presupuestal",
                        summary: "GROUP",
                        label: "Categoría de Presupuesto"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "({debitamount}-NVL({creditamount},0))* DECODE({accounttype}, 'Equity', -1, 'Income',  -1, 'Other Income', -1, 'Accounts Payable', -1, 'Credit Card', -1, 'Deferred Revenue', -1, 'Long Term Liability', -1, 'Other Current Liability', -1, 1)",
                        label: "Formula (Currency)"
                    })
                ]
        });

        let searchResultCountER = reservadoEr.runPaged().count;
        if (searchResultCountER != 0) {
            let resultER = reservadoEr.run().getRange({ start: 0, end: 1 });
            categoriappto = resultER[0].getValue(reservadoPo.columns[0]);
            reservadoer = parseFloat(resultER[0].getValue(reservadoPo.columns[1]));

        } else {
            reservadoer = 0;
        }
        console.log(reservadopo);
        console.log(reservadoer);
        console.log(resultRequisitionValue);
        console.log(resultpagoValue);
        return reservadopo + reservadoer + resultRequisitionValue + resultpagoValue;
    }


    const getComprometido = (temporalidad, trandate, categoria) => {
        let categoriappto = 0;
        let comprometido = 0;
        let formulaTemporalidad = '';
        let operator = ''
        let from = '';
        let to = '';

        if (temporalidad == TEMPORALIDAD_MENSUAL) {
            //formulaTemporalidad = "formulanumeric: ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)";
            //operator = "equalto"
            var date = new Date(trandate);
            var primerDia = new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString();
            var ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0).toLocaleDateString();

            formulaTemporalidad = "trandate"
            operator = "within"
        }

        const searchComprometido = search.create({
            type: "purchaseorder",
            filters:
                [
                    ["type", "anyof", "PurchOrd"],
                    "AND",
                    ["approvalstatus", "anyof", "2"],
                    "AND",
                    ["formulanumeric: {quantity} - {quantitybilled}", "greaterthan", "0"],
                    "AND",
                    ["custcol_lh_cp_partida_presupuestal", "anyof", categoria],
                    // "AND",
                    // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
                    "AND",
                    [formulaTemporalidad, operator, primerDia, ultimoDia]
                ],
            columns:
                [
                    search.createColumn({
                        name: "custcol_lh_cp_partida_presupuestal",
                        summary: "GROUP",
                        label: "0 Categoría de Presupuesto"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "({fxrate}+({fxrate}*{taxitem.rate}/100))*({quantity}-{quantitybilled})",
                        label: "1 Formula (Currency)"
                    })
                ]
        });
        let resultCount = searchComprometido.runPaged().count;
        if (resultCount != 0) {
            let result = searchComprometido.run().getRange({ start: 0, end: 1 });
            categoriappto = result[0].getValue(searchComprometido.columns[0]);
            comprometido = parseFloat(result[0].getValue(searchComprometido.columns[1]));
            //console.log('CO: ' + categoriappto + ' - ' + comprometido)
        } else {
            comprometido = 0;
        }
        const reservadoRequisition = search.create({
            type: "custompurchasepayment_order",
            filters:
                [
                    ["status", "anyof", "CuTrPrch111:C"],
                    "AND",
                    ["formulanumeric: ({quantity})*-1", "greaterthan", "0"],
                    "AND",
                    ["custcol_lh_cp_partida_presupuestal", "anyof", categoria],
                    "AND",
                    // ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year],
                    [formulaTemporalidad, operator, primerDia, ultimoDia]
                ],
            columns:
                [
                    search.createColumn({
                        name: "custcol_lh_cp_partida_presupuestal",
                        summary: "GROUP",
                        label: "Categoría de Presupuesto"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "({fxrate}*{quantity}*-1)",
                        label: "1 Formula (Currency)"
                    })
                ]
        });
        let searchResultCountRequisition = reservadoRequisition.runPaged().count;
        let resultRequisitionValue;
        if (searchResultCountRequisition != 0) {
            let resultRequisition = reservadoRequisition.run().getRange({ start: 0, end: 1 });
            categoriappto = resultRequisition[0].getValue(reservadoRequisition.columns[0]);
            resultRequisitionValue = parseFloat(resultRequisition[0].getValue(reservadoRequisition.columns[1]));
        } else {
            resultRequisitionValue = 0;
        }
        return comprometido + resultRequisitionValue;
    }


    const getEjecutado = (temporalidad, trandate, categoria) => {
        let categoriappto = 0;
        let ejecutado = 0;
        let formulaTemporalidad = '';
        let operator = ''
        let from = '';
        let to = '';

        if (temporalidad == TEMPORALIDAD_MENSUAL) {
            //formulaTemporalidad = "formulanumeric: ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)";
            //operator = "equalto"
            var date = new Date(trandate);
            var primerDia = new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString();
            var ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0).toLocaleDateString();

            formulaTemporalidad = "trandate"
            operator = "within"
        }

        const searchEjecutado = search.create({
            type: "transaction",
            filters:
                [

                    [["custbodyau_estapptoenc", "anyof", "5"], "AND", ["type", "anyof", "VendBill", "ExpRept"], "AND", [formulaTemporalidad, operator, primerDia, ultimoDia], "AND", ["custcol_lh_cp_partida_presupuestal", "anyof", categoria]],
                    "OR",
                    [["type", "anyof", "VendCred"], "AND", [formulaTemporalidad, operator, primerDia, ultimoDia], "AND", ["custcol_lh_cp_partida_presupuestal", "anyof", categoria]],
                    "AND",
                    ["memorized", "is", "F"],
                    "AND",
                    ["formulanumeric: NVL({debitamount},0) + NVL({creditamount},0)", "greaterthan", "0"],
                    "AND",
                    ["posting", "is", "T"],
                    "AND",
                    ["formulatext: NVL({account},'X')", "isnot", "X"]
                ],
            columns:

                [
                    search.createColumn({
                        name: "custcol_lh_cp_partida_presupuestal",
                        summary: "GROUP",
                        label: "Categoría de Presupuesto"
                    }),
                    search.createColumn({
                        name: "formulacurrency",
                        summary: "SUM",
                        formula: "DECODE({currency.symbol}, 'CANT',  (NVL({debitamount},0)-NVL({creditamount},0)) / 1, (NVL({debitamount},0)-NVL({creditamount},0))/ 1)* DECODE({accounttype}, 'Equity', -1, 'Income',  -1, 'Other Income', -1, 'Accounts Payable', -1, 'Credit Card', -1, 'Deferred Revenue', -1, 'Long Term Liability', -1, 'Other Current Liability', -1, 1)",
                        label: "Formula (Currency)"
                    })
                ]
        });
        let resultCount = searchEjecutado.runPaged().count;
        if (resultCount != 0) {
            let result = searchEjecutado.run().getRange({ start: 0, end: 1 });
            categoriappto = result[0].getValue(searchEjecutado.columns[0]);
            ejecutado = parseFloat(result[0].getValue(searchEjecutado.columns[1]));
        } else {
            ejecutado = 0;
        }
        return ejecutado;
    }


    const sysDate = (date_param) => {
        try {
            let date = new Date(date_param);
            let month = date.getMonth() + 1; // jan = 0
            let year = date.getFullYear();
            month = month <= 9 ? '0' + month : month;
            return {
                month: month,
                year: year
            }
        } catch (e) {
            console.log('Error-sysDate', e);
        }
    }


    const getTipoCambio = (currency) => {
        //let currency = new Array();
        let exchange = 0;
        if (currency == CURRENCY_US_SOLES) {
            exchange = 1;
        } else {
            let objSearch = search.load({ id: TIPO_CAMBIO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_tc_moneda', operator: search.Operator.ANYOF, values: currency });
            filters.push(filterOne);
            // const filterTwo = search.createFilter({ name: 'custrecord_lh_tc_periodo', operator: search.Operator.ANYOF, values: internalidPeriod });
            // filters.push(filterTwo);
            let searchResultCount = objSearch.runPaged().count;

            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });

                exchange = parseFloat(result[0].getValue({ name: "custrecord_lh_tc_tipo_cambio", summary: "GROUP" }));

            } else {
                alert('No existe un tipo de cambio para esta moneda.');
            }
        }
        return exchange;
    }


    return {
        pageInit: pageInit,
        //saveRecord: saveRecord,
        //fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        validateLine: validateLine,
        //sublistChanged: sublistChanged
    }
});


//?COMPROMETIDO
// var purchaseorderSearchObj = search.create({
//     type: "purchaseorder",
//     filters:
//     [
//        ["type","anyof","PurchOrd"],
//        "AND",
//        ["approvalstatus","anyof","2"],
//        "AND",
//        ["formulanumeric: {quantity} - {quantitybilled}","greaterthan","0"],
//        "AND",
//        ["custcol_lh_ppto_flag","noneof","@NONE@"],
//        "AND",
//        ["formulanumeric: ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)","equalto","0"],
//        "AND",
//        ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))","startswith","2023"]
//     ],
//     columns:
//     [
//        search.createColumn({
//           name: "custcol_lh_ppto_flag",
//           summary: "GROUP",
//           label: "Categoría de Presupuesto"
//        }),
//        search.createColumn({
//           name: "formulacurrency",
//           summary: "SUM",
//           formula: "DECODE({currency.symbol}, 'MXN', NVL({rate},0)/20,'COP',NVL({rate},0)/3600,NVL({rate},0)*({quantity}-{quantitybilled}))",
//           label: "Formula (Currency)"
//        })
//     ]
//  });
//  var searchResultCount = purchaseorderSearchObj.runPaged().count;
//  log.debug("purchaseorderSearchObj result count",searchResultCount);
//  purchaseorderSearchObj.run().each(function(result){
//     // .run().each has a limit of 4,000 results
//     return true;
//  });


//?EJECUTADO
// var transactionSearchObj = search.create({
//     type: "transaction",
//     filters:
//     [
//        [["memorized","is","F"],"AND",["formulanumeric: NVL({debitamount},0) + NVL({creditamount},0)","greaterthan","0"],"AND",["posting","is","T"],"AND",["formulatext: NVL({account},'X')","isnot","X"],"AND",["account.custrecordlh_aplica_ppto","is","T"],"AND",["formulanumeric: ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)","equalto","2"],"AND",["custcol_lh_ppto_flag","noneof","@NONE@"],"AND",["type","anyof","VendBill","Journal"]],
//        "OR",
//        [["approvalstatus","anyof","2"],"AND",["type","anyof","ExpRept"]]
//     ],
//     columns:
//     [
//        search.createColumn({
//           name: "custcol_lh_ppto_flag",
//           summary: "GROUP",
//           label: "Categoría de Presupuesto"
//        }),
//        search.createColumn({
//           name: "formulacurrency",
//           summary: "SUM",
//           formula: "DECODE({currency.symbol}, 'MXN', (NVL({debitamount},0)-NVL({creditamount},0)) / 20, 'COP',  (NVL({debitamount},0)-NVL({creditamount},0)) / 3600, (NVL({debitamount},0)-NVL({creditamount},0)))* DECODE({accounttype}, 'Equity', -1, 'Income',  -1, 'Other Income', -1, 'Accounts Payable', -1, 'Credit Card', -1, 'Deferred Revenue', -1, 'Long Term Liability', -1, 'Other Current Liability', -1, 1)",
//           label: "Formula (Currency)"
//        })
//     ]
//  });
//  var searchResultCount = transactionSearchObj.runPaged().count;
//  log.debug("transactionSearchObj result count",searchResultCount);
//  transactionSearchObj.run().each(function(result){
//     // .run().each has a limit of 4,000 results
//     return true;
//  });


//?RESERVADO PO
// const reservadoPo = search.create({
        //     type: "purchaseorder",
        //     filters:
        //         [
        //             ["type", "anyof", "PurchOrd"],
        //             "AND",
        //             ["custcol_lh_approval_status", "anyof", "1"],
        //             "AND",
        //             ["formulanumeric: {quantity} - {quantitybilled}", "greaterthan", "0"],
        //             "AND",
        //             ["custcol_lh_ppto_flag", "anyof", categoria],
        //             "AND",
        //             ["formulanumeric: ROUND(EXTRACT(MONTH FROM {trandate})/4 , 0)", "equalto", tempo],
        //             "AND",
        //             ["formulatext: TO_CHAR(EXTRACT(YEAR FROM {trandate}))", "startswith", year]
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
        //                 formula: "DECODE({currency.symbol}, 'MXN', NVL({rate},0)/20,'COP',NVL({rate},0)/3600,NVL({rate},0)*({quantity}-{quantitybilled}))",
        //                 label: "Formula (Currency)"
        //             })
        //         ]
        // });
        // let searchResultCountPO = reservadoPo.runPaged().count;
        // //console.log('CountPO', searchResultCountPO);
        // if (searchResultCountPO != 0) {
        //     let resultPO = reservadoPo.run().getRange({ start: 0, end: 1 });
        //     console.log('ReservadoPO', JSON.stringify(resultPO));
        //     let categoriappto = resultPO[0].getValue({ name: "custcol_lh_ppto_flag", summary: "GROUP" });
        //     let reservadopo = resultPO[0].getValue({ name: "formulacurrency", summary: "SUM", formula: "DECODE({currency.symbol}, 'MXN', NVL({rate},0)/20,'COP',NVL({rate},0)/3600,NVL({rate},0)*({quantity}-{quantitybilled}))" });
        //     console.log(categoriappto + ' - ' + parseFloat(reservadopo))
        //     //return {
        //     //     temporalidad: temporalidad,
        //     //     desviacion: desviacion,
        //     //     nivelControl: nivelControl
        //     // }
        //     return resultPO;
        // } else {
        //     return 0;
        // }
