/********************************************************************************************************************************************************
This script for Purchase Order 
/******************************************************************************************************************************************************** 
File Name: TS_CS_CONTROL_CP_Ejecutado.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 7/07/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search', 'N/record', 'N/ui/dialog', 'N/runtime'], (currentRecord, search, record, dialog, runtime) => {
    const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal'; //CO Configuración Presupuestal Search - CP PRODUCCION
    const CATEGORIA_PRESUPUESTO_SEARCH = 'customsearch_co_cetagoria_presupuesto'; //CO Categoría Presupuesto Search - CP PRODUCCION
    const ID_AÑO_SEARCH = 'customsearch_co_cp_anio'; //CO CP Año Search - CP PRODUCCION
    const CATEGORIA_PPTO_PERIODOS = 'customsearch_co_categoria_ppto_periodos'; //CO Categoria Presupuesto Periodos Search - CP PRODUCCION
    const TIPO_CAMBIO_SEARCH = 'customsearch_co_tipo_cambio'; //CO Tipo Cambio Search - CP PRODUCCION
    const DETALLE_TRANSACCION_SEARCH = 'customsearch_co_detalle_transac_search'; //CO Detalle Transacción Search - CP PRODUCCION
    const PERIODO_SEARCH = 'customsearch_co_period_search' //CO Period Search - CP PRODUCCION
    const PO_ITEM_LINES_NO_GROUP_SEARCH = 'customsearch_co_po_item_lines_2' //CO Purchase Order Item Lines NO GROUP - CP PRODUCCION
    const ER_EXPENSE_LINES_NO_GROUP_SEARCH = 'customsearch_co_er_expense_lines_2' //CO Expense Report Expense Lines NO GROUP - CP PRODUCCION
    const NON_INVENTORY_ITEM = 'NonInvtPart';
    const INVENTORY_ITEM = 'InvtPart';
    const SERVICE_ITEM = 'Service';
    const RESERVADO = 2;
    const COMPROMETIDO = 3;
    const EJECUTADO = 4;
    const PAGADO = 5;
    const TRANSFERIDO = 6;
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
    const VENDOR_BILL = 'vendorbill';
    const VENDOR_CREDIT = 'vendorcredit';
    const CURRENCY_COP = 1;
    const CURRENCY_US_DOLLAR = 2;
    const CURRENCY_CANADIAN_DOLLAR = 3;
    const CURRENCY_EURO = 4;
    const CURRENCY_PESOS_MEXICANOS = 5;
    const CURRENCY_REAL_BRASILEÑO = 6;
    const CECO_NIVEL_CONTROL = 1;
    const CUENTA_NIVEL_CONTROL = 2;
    const CATEGORIA_NIVEL_CONTROL = 3;
    //context.currentRecord.type
    let typeMode = '';

    const pageInit = (context) => {
        typeMode = context.mode; //!Importante, no borrar.
        console.log(typeMode);
    }


    const saveRecord = (context) => {
        const ambiente = 'SB';
        const DEVELOPER = ambiente; //PR - 27160
        let estado = context.currentRecord.getValue('custbody_lh_cp_estado_ppto_oc');
        console.log('User', runtime.getCurrentUser().id);
        if (typeMode == 'create' || typeMode == 'copy') {
            if (context.currentRecord.type == VENDOR_BILL) {
                console.log('User', runtime.getCurrentUser().id);
                let createdFrom = context.currentRecord.getValue('custbody_lh_create_from_flag');
                if (createdFrom.length == 0) {
                    let retorno = controlPresupuestal();
                    context.currentRecord.setValue('custbody_lh_payment_status_flag', '');
                    if (runtime.getCurrentUser().id == DEVELOPER) {
                        console.log('Pruebas internas');
                        return false;
                    } else {
                        return retorno;
                    }
                } else {
                    if (runtime.getCurrentUser().id == DEVELOPER) {
                        console.log('Pruebas internas');
                        return false;
                    } else {
                        return true;
                    }
                }
            }

            if (context.currentRecord.type == VENDOR_CREDIT) {
                context.currentRecord.setValue('custbody_lh_update_flag', '');
                return true;
            }
        } else if (typeMode == 'edit') {
            if (context.currentRecord.type == VENDOR_BILL) {
                let retorno = '';
                if (context.currentRecord.getValue('custbody_lh_update_flag') == 7) {
                    retorno = controlPresupuestal();
                } else {
                    context.currentRecord.setValue('custbody_lh_payment_status_flag', '');
                    retorno = verifyChanges(context, estado);//!COMENTAR PARA CUADRE
                }
                //let retorno = controlPresupuestal();//!DESCOMENTAR PARA CUADRE

                if (runtime.getCurrentUser().id == DEVELOPER) {
                    console.log('Pruebas internas');
                    return false;
                } else {
                    return retorno;
                }
            }

            if (context.currentRecord.type == VENDOR_CREDIT) {
                context.currentRecord.setValue('custbody_lh_update_flag', 1);
                return true;
            }
        }
    }


    function success(result) { console.log('Success: ' + result) }
    function failure(reason) { console.log('Failure: ' + reason) }


    //?Para ejecución directa =================================================================================
    const controlPresupuestal = () => {
        const objRecord = currentRecord.get();
        let json = new Array();
        let json2 = new Array();
        let json3 = new Array();
        let arrayDetalle = new Array();
        let resta = 0;
        let view_alert = 0;
        let existe_ppto = 'Tiene presupuesto';
        let cuenta = '';
        let account = 0;
        let subList = '';
        let vueltas = '';
        let articulo = '';
        let categoryEmpty = 0;
        let message = '';
        let message2 = '';
        let tipoCambio = 1;
        let scapeValidate = 0;
        let category = '';
        let categoryPPTO = '';

        try {
            let transaction = objRecord.getValue({ fieldId: 'ntype' });
            console.log('transaction', transaction);
            objRecord.setValue('custbody_lh_transaction_type_flag', transaction);
            let subsidiary = objRecord.getValue({ fieldId: 'subsidiary' });
            let config = getConfig(transaction, subsidiary); //! getConfig (FUNCTION)
            if (config != 0) {
                let currency = objRecord.getValue({ fieldId: 'currency' });
                objRecord.setValue('custbody_lh_temporalidad_flag', config.temporalidad);
                objRecord.setValue('custbody_lh_nivel_control_flag', config.nivelControl);
                let date = objRecord.getValue({ fieldId: 'trandate' });
                date = sysDate(date); //! sysDate (FUNCTION)
                let month = date.month;
                let year = getAnioId(date.year); //! getAnioId (FUNCTION)
                objRecord.setValue('custbody_lh_anio_id_flag', year);
                if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                    tipoCambio = getTipoCambio(subsidiary, month, date.year); //! getTipoCambio (FUNCTION)
                }
                let numLines = objRecord.getLineCount({ sublistId: 'item' });
                let expLines = objRecord.getLineCount({ sublistId: 'expense' });
                if (numLines != 0) {
                    subList = ITEM_SUBLIST;
                    cuenta = 'custcol_bm_itemaccount';
                    vueltas = numLines;
                    articulo = 'item';
                    message = 'Los siguientes artículos no tienen una categoría de presupesto: ';
                } else if (expLines != 0) {
                    subList = EXPENSE_SUBLIST;
                    cuenta = 'account';
                    vueltas = expLines;
                    articulo = 'category';
                    message = 'Las siguientes categorías no tienen una categoría de presupesto: ';
                }
                objRecord.setValue('custbody_lh_sublist_type_flag', subList);
                for (let i = 0; i < vueltas; i++) {
                    let art = objRecord.getSublistText({ sublistId: subList, fieldId: articulo, line: i });
                    let itemtype = objRecord.getSublistValue({ sublistId: subList, fieldId: 'itemtype', line: i });
                    let amount = objRecord.getSublistValue({ sublistId: subList, fieldId: 'amount', line: i });
                    let department = objRecord.getSublistValue({ sublistId: subList, fieldId: 'department', line: i });
                    if (department.length == 0) {
                        scapeValidate = 1
                        message2 = 'Debe ingresar el centro de costos';
                        break;
                    }

                    let recordLine = objRecord.selectLine({ sublistId: subList, line: i });
                    if (config.nivelControl == CUENTA_NIVEL_CONTROL) {
                        let artVal = parseInt(objRecord.getSublistValue({ sublistId: subList, fieldId: articulo, line: i }));
                        account = getAccount(artVal);
                        recordLine.setCurrentSublistValue({ sublistId: subList, fieldId: 'custcol_nondeductible_account', value: account });
                    }

                    if (config.nivelControl == CATEGORIA_NIVEL_CONTROL) {
                        category = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcol_lh_categoria_ppto_oc', line: i });
                        if (category.length == 0) {
                            scapeValidate = 1
                            message2 = 'Debe ingresar la categoría de presupuesto';
                            break;
                        }
                    }

                    if (itemtype != 'Discount') {
                        categoryPPTO = getValidateCategoriaPPTO(subsidiary, department, category, account, config.nivelControl); //! getValidateCategoriaPPTO (FUNCTION)
                        recordLine.setCurrentSublistValue({ sublistId: subList, fieldId: 'custcol_lh_ppto_flag', value: categoryPPTO });
                        objRecord.commitLine({ sublistId: subList });
                        if (categoryPPTO != 0) {
                            json.push({
                                category: categoryPPTO,
                                amount: amount
                            });
                        } else {
                            categoryEmpty = 1;
                            json3.push(' ' + art);
                        }
                    }
                }
                if (scapeValidate == 1) {
                    dialog.alert({ title: 'Información', message: message2 });
                    return false;
                }

                if (categoryEmpty == 1) {
                    dialog.alert({
                        title: 'Advertencia',
                        message: message + json3
                    }).then(success).catch(failure);
                    return false;
                }
                let categorias = json.map((x) => x.category);
                let arrayCategorias = [...new Set(categorias)];
                let arrayMontos = [];
                arrayCategorias.forEach((cat) => {
                    let filtro = json.filter((x) => x.category == cat);
                    let montos = filtro.reduce((acc, valor) => acc + valor.amount, 0);
                    arrayMontos.push(montos);
                });
                // console.log(arrayCategorias);
                // console.log(arrayMontos);
                for (let j in arrayCategorias) {
                    resta = 0;
                    // existe_ppto = 'Tiene presupuesto';
                    let getCategoria = getDisponible(arrayCategorias[j], year, month, config.temporalidad); //! getDisponible (FUNCTION)
                    let reservado = getReservado(arrayCategorias[j], year, month, config.temporalidad); //! getReservado (FUNCTION)
                    resta = (getCategoria.disponible - reservado) - (parseFloat(arrayMontos[j]) / tipoCambio);
                    //! 29k = 30k - 1K
                    //console.log('Resta', resta + ' = ' + getCategoria.disponible + ' - ' + (parseFloat(arrayMontos[j]) / tipoCambio));
                    if (resta < 0) {
                        view_alert = 1;
                        existe_ppto = 'Los siguientes centros de costo no tienen presupuesto disponible: ';
                        json2.push(' ' + getCategoria.categoria);
                        //console.log('No tiene ppto', json2)
                    }
                    arrayDetalle.push(arrayCategorias[j]);
                }
                //objRecord.setValue('custbody_lh_categories_id_flag', JSON.stringify(arrayDetalle));
                console.log('No presenta obs', json2);
                if (view_alert == 1) {
                    if (config.desviacion == DESVIACION_ADVERTENCIA) {
                        objRecord.setValue('custbody_lh_cp_estado_ppto_oc', EJECUTADO);
                        //console.log('Advertencia, se guardó');
                        dialog.alert({
                            title: 'Advertencia',
                            message: existe_ppto + json2
                        }).then(success).catch(failure);
                        //return true;
                        return false;
                    } else if (config.desviacion == DESVIACION_BLOQUEO) {
                        //console.log('Bloqueo, no se guardó');
                        dialog.alert({
                            title: 'Bloqueo',
                            message: existe_ppto + json2
                        }).then(success).catch(failure);
                        return false;
                    }
                } else if (view_alert == 0) {
                    objRecord.setValue('custbody_lh_cp_estado_ppto_oc', EJECUTADO);
                    console.log('Tiene ppto se gradó correctamente');
                    return true;
                    //return false;
                }
            } else {
                alert('La subsidiaria no cuenta con una configuración de presupuesto.');
                return false;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    }


    const verifyChanges = (context, estado) => {
        let scapeValidate = 0;
        try {
            let retorno = true;
            let objSearch = search.load({ id: PO_ITEM_LINES_NO_GROUP_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: context.currentRecord.id });
            filters.push(filterOne);
            let searchResultCount = objSearch.runPaged().count;
            console.log(searchResultCount);
            let subList = context.currentRecord.getValue('custbody_lh_sublist_type_flag');
            if (subList.length != 0) {
                let numLines = context.currentRecord.getLineCount({ sublistId: subList });
                if (searchResultCount != numLines) {
                    console.log('Cambio por lineas diferentes');
                    scapeValidate = 1;
                } else {
                    let result = objSearch.run().getRange({ start: 0, end: 100 });
                    console.log('Results-Edit', result);
                    for (let i in result) {
                        let amount = parseFloat(result[i].getValue({ name: "debitfxamount" }));
                        console.log('amount', amount);
                        let department = result[i].getValue({ name: "department" });
                        console.log('department', department);
                        let category = result[i].getValue({ name: "custcol_lh_categoria_ppto_oc" });
                        console.log('category', category);

                        let thisAmount = context.currentRecord.getSublistValue({ sublistId: subList, fieldId: 'amount', line: i });
                        console.log('thisAmount', thisAmount);
                        let thisDepartment = context.currentRecord.getSublistValue({ sublistId: subList, fieldId: 'department', line: i });
                        console.log('thisDepartment', thisDepartment);
                        let thisCategory = context.currentRecord.getSublistValue({ sublistId: subList, fieldId: 'custcol_lh_categoria_ppto_oc', line: i });
                        console.log('thisCategory', thisCategory);

                        if (department != thisDepartment) {
                            console.log('Cambio por centro de costo diferente');
                            scapeValidate = 1;
                            break;
                        }

                        if (category != thisCategory) {
                            console.log('Cambio por categoría diferente');
                            scapeValidate = 1;
                            break;
                        }

                        if (amount != parseFloat(thisAmount)) {
                            console.log('Cambio por monto diferente');
                            scapeValidate = 1;
                            break;
                        }
                    }
                }
                console.log('scapeValidate', scapeValidate);
                if (scapeValidate == 1) {
                    if (estado == EJECUTADO) {
                        retorno = controlPresupuestal();
                    } else {
                        alert('EL registro no puede editarse en estado PAGADO');
                        scapeValidate = 0;
                        retorno = false;
                    }
                }
                context.currentRecord.setValue('custbody_lh_update_flag', scapeValidate);
                //retorno = false;
                return retorno;
            }
            return retorno;
        } catch (error) {
            console.log(error)
        }
    }


    function success(result) { console.log('Success: ' + result) }
    function failure(reason) { console.log('Failure: ' + reason) }


    const getConfig = (transaction, subsidiary) => {
        try {
            let objSearch = search.load({ id: CONFIG_PPTO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_cp_transaccion', operator: search.Operator.ANYOF, values: transaction });
            filters.push(filterOne);
            const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
            filters.push(filterTwo);
            const filterThree = search.createFilter({ name: 'custrecord_lh_cp_flujo_aprobacion', operator: search.Operator.IS, values: true });
            filters.push(filterThree);

            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount != 0) {
                let resultConfig = objSearch.run().getRange({ start: 0, end: 1 });
                let temporalidad = resultConfig[0].getValue({ name: "custrecord_lh_cp_temporalidad" });
                let desviacion = resultConfig[0].getValue({ name: "custrecord_lh_cp_desviacion_ppto" });
                let nivelControl = resultConfig[0].getValue({ name: "custrecord_lh_cp_nivel_control" });
                return {
                    temporalidad: temporalidad,
                    desviacion: desviacion,
                    nivelControl: nivelControl
                }
            } else {
                return 0;
            }
        } catch (error) {
            console.log(error)
        }
    }


    const getDisponible = (category, year, month, temporalidad) => {
        let disponible = 0;
        let arregloTrimestre = 0;
        let suma = 0.0;
        let categoria = '';
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
            //console.log('searchResultCount', searchResultCount);
            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                console.log(result);
                categoria = result[0].getText({ name: "custrecord_lh_cp_centro_costo", join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA", });

                if (temporalidad == TEMPORALIDAD_MENSUAL) {
                    disponible = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                } else if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
                    for (let i in trimestre) {
                        let bloque = trimestre[i].includes(month.toString());
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
                    //console.log('Disponible', disponible);
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
                categoria = search.lookupFields({ type: 'customrecord_lh_categoria_presupuesto', id: category, columns: ['custrecord_lh_cp_nombre_categoria'] });
                categoria = categoria.custrecord_lh_cp_nombre_categoria[0].text;
                return {
                    disponible: disponible,
                    categoria: categoria
                }
            }
        } catch (error) {
            console.log(error);
        }
    }


    const getReservado = (category, year, month, temporalidad) => {
        let reservado = 0;
        let arregloTrimestre = 0;
        let suma = 0.0;
        // let categoria = '';
        try {
            let objSearch = search.load({ id: CATEGORIA_PPTO_PERIODOS });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_detalle_cppto_categoria', operator: search.Operator.ANYOF, values: category });
            filters.push(filterOne);
            const filterTwo = search.createFilter({ name: 'custrecord_lh_detalle_cppto_status', operator: search.Operator.ANYOF, values: RESERVADO });
            filters.push(filterTwo);
            const filterThree = search.createFilter({ name: 'custrecord_lh_detalle_cppto_anio', operator: search.Operator.ANYOF, values: year });
            filters.push(filterThree);
            let searchResultCount = objSearch.runPaged().count;
            //console.log('searchResultCount', searchResultCount);
            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                //console.log(result);
                // categoria = result[0].getText({ name: "custrecord_lh_cp_centro_costo", join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA", });
                if (temporalidad == TEMPORALIDAD_MENSUAL) {
                    reservado = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                } else if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
                    //!const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
                    for (let i in trimestre) {
                        let bloque = trimestre[i].includes(month.toString());
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
                    reservado = suma;
                    //console.log('Disponible', disponible);
                } else if (temporalidad == TEMPORALIDAD_ANUAL) {
                    for (let i in anual) {
                        let monto = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + anual[i] }));
                        suma += monto
                    }
                    reservado = suma;
                }
                return reservado;
            } else {
                // categoria = search.lookupFields({ type: CATEGORIA_PRESUPUESTO_RECORD, id: category, columns: ['custrecord_lh_cp_nombre_categoria'] });
                // categoria = categoria.custrecord_lh_cp_nombre_categoria[0].text;
                return reservado;
            }
        } catch (error) {
            console.log(error);
        }
    }


    const getValidateCategoriaPPTO = (subsidiary, department, category, account, nivelControl) => {
        try {
            let objSearch = search.load({ id: CATEGORIA_PRESUPUESTO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_cp_categoriap_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
            filters.push(filterOne);
            if (nivelControl == CUENTA_NIVEL_CONTROL) {
                const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_cuenta', operator: search.Operator.ANYOF, values: account });
                filters.push(filterTwo);
            } else if (nivelControl == CATEGORIA_NIVEL_CONTROL) {
                const filterFour = search.createFilter({ name: 'custrecord_lh_cp_nombre_categoria', operator: search.Operator.ANYOF, values: category });
                filters.push(filterFour);
            }
            const filterThree = search.createFilter({ name: 'custrecord_lh_cp_centro_costo', operator: search.Operator.ANYOF, values: department });
            filters.push(filterThree);
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                let cate = result[0].getValue({ name: "internalid" });
                return cate;
            } else {
                return 0;
            }
        } catch (error) {
            console.log('Error-getCategoriaPPTO', error)
        }
    }


    const getAnioId = (year) => {
        let objSearch = search.load({ id: ID_AÑO_SEARCH });
        let filters = objSearch.filters;
        const filterOne = search.createFilter({ name: 'name', operator: search.Operator.IS, values: year });
        filters.push(filterOne);
        let resultConfig = objSearch.run().getRange({ start: 0, end: 1 });
        let anio = resultConfig[0].getValue(objSearch.columns[0]);
        return anio;
    }


    const getTipoCambio = (subsidiary, month, year) => {
        let period = '';
        if (month == '01') {
            period = 'ene ' + year;
        } else if (month == '02') {
            period = 'feb ' + year;
        } else if (month == '03') {
            period = 'mar ' + year;
        } else if (month == '04') {
            period = 'abr ' + year;
        } else if (month == '05') {
            period = 'may ' + year;
        } else if (month == '06') {
            period = 'jun ' + year;
        } else if (month == '07') {
            period = 'jul ' + year;
        } else if (month == '08') {
            period = 'ago ' + year;
        } else if (month == '09') {
            period = 'sep ' + year;
        } else if (month == '10') {
            period = 'oct ' + year;
        } else if (month == '11') {
            period = 'nov ' + year;
        } else if (month == '12') {
            period = 'dic ' + year;
        }
        //console.log('Period', period);
        let loadSearch = search.load({ id: PERIODO_SEARCH });
        let filters2 = loadSearch.filters;
        const filterOne2 = search.createFilter({ name: 'periodname', operator: search.Operator.STARTSWITH, values: period });
        filters2.push(filterOne2);
        let result2 = loadSearch.run().getRange({ start: 0, end: 1 });
        let internalidPeriod = result2[0].getValue({ name: "internalid" });
        //console.log('internalidPeriod', internalidPeriod);

        let objSearch = search.load({ id: TIPO_CAMBIO_SEARCH });
        let filters = objSearch.filters;
        const filterOne = search.createFilter({ name: 'custrecord_lh_tc_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
        filters.push(filterOne);
        // const filterTwo = search.createFilter({ name: 'custrecord_lh_tc_periodo', operator: search.Operator.ANYOF, values: internalidPeriod });
        // filters.push(filterTwo);
        let searchResultCount = objSearch.runPaged().count;
        if (searchResultCount != 0) {
            let result = objSearch.run().getRange({ start: 0, end: 1 });
            let tipoCambio = parseFloat(result[0].getValue({ name: "custrecord_lh_tc_tipo_cambio" }));
            //console.log('Tipo Cambio', tipoCambio);
            return tipoCambio;
        } else {
            return 0;
        }
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
            log.error('Error-sysDate', e);
        }
    }


    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    }
});
