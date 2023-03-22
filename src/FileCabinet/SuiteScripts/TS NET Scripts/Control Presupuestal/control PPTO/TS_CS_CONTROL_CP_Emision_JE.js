/********************************************************************************************************************************************************
This script for Purchase Order 
/******************************************************************************************************************************************************** 
File Name: TS_CS_CONTROL_CP_Emision.js                                                                        
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
define(['N/currentRecord', 'N/search', 'N/ui/dialog', 'N/runtime'], (currentRecord, search, dialog, runtime) => {
    const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal'; //CO Configuración Presupuestal Search - CP PRODUCCION
    const CATEGORIA_PRESUPUESTO_SEARCH = 'customsearch_co_cetagoria_presupuesto'; //CO Categoría Presupuesto Search - CP PRODUCCION
    const ID_AÑO_SEARCH = 'customsearch_co_cp_anio'; //CO CP Año Search - CP PRODUCCION
    const CATEGORIA_PPTO_PERIODOS = 'customsearch_co_categoria_ppto_periodos'; //CO Categoria Presupuesto Periodos Search - CP PRODUCCION
    const TIPO_CAMBIO_SEARCH = 'customsearch_co_tipo_cambio'; //CO Tipo Cambio Search - CP PRODUCCION
    const PERIODO_SEARCH = 'customsearch_co_period_search' //CO Period Search - CP PRODUCCION
    const PO_ITEM_LINES_NO_GROUP_SEARCH = 'customsearch_co_po_item_lines_2' //CO Purchase Order Item Lines NO GROUP - CP PRODUCCION
    const JE_LINE_LINES_SEARCH = 'customsearch_co_je_line_lines';  //CO Journal Entries Line Lines - CP PRODUCCION
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
    const JOURNAL_SUBLIST = 'line'
    const CECO_NIVEL_CONTROL = 1;
    const CUENTA_NIVEL_CONTROL = 2;
    const CATEGORIA_NIVEL_CONTROL = 3;
    const CURRENCY_COP = 1;
    const CURRENCY_US_DOLLAR = 2;
    const CURRENCY_CANADIAN_DOLLAR = 3;
    const CURRENCY_EURO = 4;
    const CURRENCY_PESOS_MEXICANOS = 5;
    const CURRENCY_REAL_BRASILEÑO = 6;
    const CATEGORIA_PRESUPUESTO_RECORD = 'customrecord_lh_categoria_presupuesto';
    const PURCHASE_ORDER = 'purchaseorder';
    const VENDOR_CREDIT = 'vendorcredit';
    const EXPENSE_REPORT = 'expensereport';
    const JOURNAL = 'journalentry';
    const ACCOUNT_TYPE_EXPENSE = 'Expense';
    const CREATE = 'create';
    const COPY = 'copy';
    const EDIT = 'edit';
    const DETALLE_TRANSACCION_RECORD = 'customrecord_lh_detalle_transaccion';
    let typeMode = '';

    const pageInit = (context) => {
        typeMode = context.mode; //!Importante, no borrar.
        console.log('Type', context.currentRecord.getValue('type'));
        if (typeMode == 'copy') {
            context.currentRecord.setValue('custbody_lh_cp_estado_ppto_oc', RESERVADO);
            context.currentRecord.setValue('custbody_lh_sublist_type_flag', '');
            context.currentRecord.setValue('custbody_lh_anio_id_flag', '');
            context.currentRecord.setValue('custbody_lh_temporalidad_flag', '');
            context.currentRecord.setValue('custbody_lh_create_from_flag', '');
            context.currentRecord.setValue('custbody_lh_nivel_control_flag', '');
            context.currentRecord.setValue('custbody_lh_update_flag', '');

            if (context.currentRecord.type == EXPENSE_REPORT) {
                context.currentRecord.setValue('custbody_lh_ppto_flag_body', '');
            }
        }
        console.log(typeMode);
        console.log('User: ', runtime.getCurrentUser().id);
        console.log('Script de control ppto activos');
    }


    const saveRecord = (context) => {
        const ambiente = 'SB';
        const DEVELOPER = 27160; //PR - 27160 //SB - 21633
        let estado = context.currentRecord.getValue('custbody_lh_cp_estado_ppto_oc');
        console.log('User', runtime.getCurrentUser().id);
        if (typeMode == CREATE || typeMode == COPY) {
            if (context.currentRecord.type == PURCHASE_ORDER) {
                let retorno = controlPresupuestal();
                context.currentRecord.setValue('custbody_lh_cp_estado_ppto_oc', RESERVADO);
                if (runtime.getCurrentUser().id == DEVELOPER) {
                    console.log('Pruebas internas');
                    return false;
                } else {
                    return retorno;
                }
            }

            if (context.currentRecord.type == EXPENSE_REPORT) {
                let retorno = controlPresupuestalIG();
                context.currentRecord.setValue('custbody_lh_cp_estado_ppto_oc', RESERVADO);
                return retorno;
            }

            if (context.currentRecord.type == JOURNAL) {
                let retorno = controlPresupuestal();
                context.currentRecord.setValue('custbody_lh_cp_estado_ppto_oc', EJECUTADO);
                if (runtime.getCurrentUser().id == DEVELOPER) {
                    console.log('Pruebas internas');
                    return false;
                } else {
                    return retorno;
                }

            }
        }

        if (typeMode == EDIT) {
            if (context.currentRecord.type == PURCHASE_ORDER) {
                if (estado == RESERVADO || estado == COMPROMETIDO) {
                    let retorno = verifyChanges(context, estado);
                    if (runtime.getCurrentUser().id == DEVELOPER) {
                        console.log('Pruebas internas');
                        return false;
                    } else {
                        return retorno;
                    }
                } else if (estado.length == 0) {
                    let retorno = controlPresupuestal();
                    context.currentRecord.setValue('custbody_lh_cp_estado_ppto_oc', RESERVADO);
                    if (retorno == true) {
                        context.currentRecord.setValue('approvalstatus', 1);
                        context.currentRecord.setValue('custbody_lh_update_flag', 2);
                        console.log('La ordén de compra ' + context.currentRecord.id + ' tiene ppto disponible.');
                        console.log('La ordén de compra ' + context.currentRecord.id + ' ingresará al control presupuestal.');
                        console.log('La ordén de compra ' + context.currentRecord.id + ' se guardó correctamente.')
                    }
                    return retorno;
                    //return true;
                } else if (typeMode == 'xedit') {
                    return true;
                } else {
                    console.log('El registro no puede editarse');
                    return false;
                }
            }

            if (context.currentRecord.type == EXPENSE_REPORT) {
                // if (estado == RESERVADO || estado == EJECUTADO || estado == PAGADO) {
                //     let retorno = controlPresupuestalIGEDIT(context, estado);
                // }
                return true;
            }

            if (context.currentRecord.type == JOURNAL) {
                if (estado == EJECUTADO) {
                    let retorno = verifyChangesJE(context, estado);
                    console.log('RETORNO', retorno);
                    return retorno;
                }
            }
        }
    }


    const controlPresupuestal = () => {
        const objRecord = currentRecord.get();
        let json = new Array();
        let json2 = new Array();
        let json3 = new Array();
        let resta = 0;
        let view_alert = 0;
        let existe_ppto = 'Tiene presupuesto';
        let cuenta = '';
        let account = 0;
        let category = 0;
        let subList = '';
        let vueltas = '';
        let articulo = '';
        let categoryEmpty = 0;
        let message = '';
        let message2 = '';
        let tipoCambio = 1;
        let scapeValidate = 0;
        let categoryPPTO = '';
        let arrayCategoriasFirst = new Array();
        let arrayCategories = new Array();

        try {
            let transaction = objRecord.getValue({ fieldId: 'ntype' });
            console.log('Transaction', transaction);
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
                    if (tipoCambio == 0) {
                        dialog.alert({ title: 'Información', message: 'No se encuentra un tipo de cambio para esta transacción' });
                        return false;
                    }
                }
                let numLines = objRecord.getLineCount({ sublistId: 'item' });
                let expLines = objRecord.getLineCount({ sublistId: 'expense' });
                let jouLines = objRecord.getLineCount({ sublistId: 'line' });
                if (numLines > 0) {
                    subList = ITEM_SUBLIST;
                    cuenta = 'custcol_bm_itemaccount';
                    vueltas = numLines;
                    articulo = 'item';
                    message = 'Los siguientes artículos no tienen una categoría de presupesto: ';
                } else if (expLines > 0) {
                    subList = EXPENSE_SUBLIST;
                    cuenta = 'account';
                    vueltas = expLines;
                    articulo = 'category';
                    message = 'Las siguientes categorías no tienen una categoría de presupesto: ';
                } else if (jouLines > 0) {
                    subList = JOURNAL_SUBLIST;
                    cuenta = 'custcol_bm_itemaccount';
                    vueltas = jouLines;
                    articulo = 'account';
                    message = 'Los siguientes cuentas no tienen una categoría de presupesto: ';
                }
                //console.log('vueltas', vueltas);
                objRecord.setValue('custbody_lh_sublist_type_flag', subList);
                for (let i = 1; i < vueltas; i++) {
                    //let validateCategory = 1;
                    let art = '';
                    let aplicaPPTO = '';
                    let amount = 0;
                    let debit = 0;
                    let credit = 0;
                    let department = 0;
                    if (transaction == 1) {//?JOURNAL
                        aplicaPPTO = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcollh_aplica_ppto', line: i });
                        console.log('aplicaPPTO', aplicaPPTO);
                        if (aplicaPPTO == true) {
                            art = objRecord.getSublistText({ sublistId: subList, fieldId: articulo, line: i });
                            debit = objRecord.getSublistValue({ sublistId: subList, fieldId: 'debit', line: i });
                            credit = objRecord.getSublistValue({ sublistId: subList, fieldId: 'credit', line: i });
                            if (debit.length != 0) {
                                amount = parseFloat(debit)
                            }

                            if (credit.length != 0) {
                                amount = parseFloat(-credit)
                            }
                            if (amount.length != 0) {
                                console.log(art + ' - ' + aplicaPPTO + ' - ' + typeof amount + ' - ' + amount + ' - ' + i);
                                department = objRecord.getSublistValue({ sublistId: subList, fieldId: 'department', line: i });
                                if (department.length == 0) {
                                    scapeValidate = 1
                                    message2 = 'Debe ingresar el centro de costo';
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

                                categoryPPTO = getValidateCategoriaPPTO(subsidiary, department, category, account, config.nivelControl); //! getValidateCategoriaPPTO (FUNCTION)
                                recordLine.setCurrentSublistValue({ sublistId: subList, fieldId: 'custcol_lh_ppto_flag', value: categoryPPTO });
                                objRecord.commitLine({ sublistId: subList });
                                if (categoryPPTO != 0) {
                                    json.push({
                                        category: categoryPPTO,
                                        amount: amount
                                    });

                                    arrayCategoriasFirst.push({
                                        category: categoryPPTO,
                                        department: department
                                    });
                                } else {
                                    categoryEmpty = 1;
                                    json3.push(' ' + art);
                                }
                            }
                        }
                    } else {
                        art = objRecord.getSublistText({ sublistId: subList, fieldId: articulo, line: i });
                        amount = objRecord.getSublistValue({ sublistId: subList, fieldId: 'amount', line: i });
                        let department = objRecord.getSublistValue({ sublistId: subList, fieldId: 'department', line: i });
                        if (department.length == 0) {
                            scapeValidate = 1
                            message2 = 'Debe ingresar el centro de costo';
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
                if (transaction == 1) {//?JOURNAL
                    //console.log('arrayCategoriasBefore', arrayCategoriasFirst);
                    let hash = {};
                    arrayCategoriasFirst = arrayCategoriasFirst.filter(o => hash[o.category] ? false : hash[o.category] = true);
                    //console.log('arrayCategoriasAfter', arrayCategoriasFirst);
                }

                if (scapeValidate == 1) {
                    dialog.alert({ title: 'Información', message: message2 });
                    return false;
                }

                if (categoryEmpty == 1) {
                    dialog.alert({
                        title: 'Advertencia',
                        message: message + json3
                    });
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
                console.log('arrayCategorias', arrayCategorias);
                console.log('arrayMontos', arrayMontos);
                for (let j in arrayCategorias) {
                    resta = 0;
                    // existe_ppto = 'Tiene presupuesto';
                    let getCategoria = getDisponible(arrayCategorias[j], year, month, config.temporalidad); //! getDisponible (FUNCTION)
                    let reservado = getReservado(arrayCategorias[j], year, month, config.temporalidad); //! getReservado (FUNCTION)
                    let monto = parseFloat(arrayMontos[j]) / tipoCambio;
                    resta = (getCategoria.disponible - reservado) - monto;
                    //! 29k = 30k - 1K
                    console.log('Resta', resta + ' = (' + getCategoria.disponible + ' - ' + reservado + ') - ' + (parseFloat(arrayMontos[j]) / tipoCambio));
                    if (resta < 0) {
                        view_alert = 1;
                        existe_ppto = 'Los siguientes centros de costo no tienen presupuesto disponible: ';
                        json2.push(' ' + getCategoria.categoria);
                        //console.log('No tiene ppto', json2)
                    }
                    if (transaction == 1) {//?JOURNAL
                        let ceco = '';
                        for (let k in arrayCategoriasFirst) {
                            //console.log('Compare', arrayCategoriasFirst[k].category + ' == ' + getCategoria.cate)
                            if (arrayCategoriasFirst[k].category == getCategoria.cate) {
                                ceco = arrayCategoriasFirst[k].department;
                                break;
                            }
                        }
                        arrayCategories.push([ceco.toString(), monto]);
                    }

                }
                if (transaction == 1) {
                    objRecord.setValue('custbody_lh_categories_id_flag', JSON.stringify(arrayCategories));
                    console.log('arrayCategories', arrayCategories);
                }

                if (view_alert == 1) {
                    if (config.desviacion == DESVIACION_ADVERTENCIA) {
                        objRecord.setValue('custbody_lh_cp_estado_ppto_oc', RESERVADO);
                        //console.log('Advertencia, se guardó');
                        dialog.alert({
                            title: 'Advertencia',
                            message: existe_ppto + json2
                        }).then(success).catch(failure);
                        //return false;
                        return true;
                    } else if (config.desviacion == DESVIACION_BLOQUEO) {
                        //console.log('Bloqueo, no se guardó');
                        dialog.alert({
                            title: 'Bloqueo',
                            message: existe_ppto + json2
                        });
                        return false;
                    }
                } else if (view_alert == 0) {
                    return true;
                    //return false;
                }
            } else {
                alert('La subsidiaria no cuenta con una configuración de presupuesto.');
            }
        } catch (error) {
            alert(error);
            console.log(error);
            return false;
        }
    }


    const controlPresupuestalIG = () => {
        const objRecord = currentRecord.get();
        let json = new Array();
        let json2 = new Array();
        let json3 = new Array();
        let resta = 0;
        let view_alert = 0;
        let existe_ppto = 'Tiene presupuesto';
        let cuenta = '';
        let account = 0;
        let category = 0;
        let subList = '';
        let vueltas = '';
        let articulo = '';
        let categoryEmpty = 0;
        let message = '';
        let message2 = '';
        let tipoCambio = 1;
        let scapeValidate = 0;
        let categoryid = 0;
        let sumamonto = 0;
        let categoryPPTO = '';

        try {
            let transaction = objRecord.getValue({ fieldId: 'ntype' });
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
                let department = objRecord.getValue({ fieldId: 'department' });
                if (config.nivelControl == CATEGORIA_NIVEL_CONTROL) {
                    category = objRecord.getValue({ fieldId: 'custbody_lh_cate_ppto_body' });
                    if (category.length == 0) {
                        message2 = 'Debe ingresar la categoría de presupuesto';
                        dialog.alert({ title: 'Información', message: message2 });
                        return false;
                    }
                }
                objRecord.setValue('custbody_lh_anio_id_flag', year);
                if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                    tipoCambio = getTipoCambio(subsidiary, month, date.year); //! getTipoCambio (FUNCTION)
                    if (tipoCambio == 0) {
                        dialog.alert({ title: 'Información', message: 'No se encuentra un tipo de cambio para esta transacción' });
                        return false;
                    }
                }
                let expLines = objRecord.getLineCount({ sublistId: 'expense' });
                subList = EXPENSE_SUBLIST;
                cuenta = 'account';
                vueltas = expLines;
                articulo = 'category';
                message = 'Las siguientes categorías no tienen una categoría de presupesto: ';
                objRecord.setValue('custbody_lh_sublist_type_flag', subList);

                categoryPPTO = getValidateCategoriaPPTO(subsidiary, department, category, account, config.nivelControl); //! getValidateCategoriaPPTO (FUNCTION)
                if (categoryPPTO != 0) {
                    objRecord.setValue('custbody_lh_ppto_flag_body', categoryPPTO);
                } else {
                    dialog.alert({ title: 'Información', message: message });
                    return false;
                }

                for (let i = 0; i < vueltas; i++) {
                    let amount = parseFloat(objRecord.getSublistValue({ sublistId: subList, fieldId: 'amount', line: i }));
                    sumamonto += amount;
                }

                // existe_ppto = 'Tiene presupuesto';
                let monto = sumamonto / tipoCambio;
                objRecord.setValue('custbody_lh_amount_flag', monto);
                let advance = parseFloat(objRecord.getValue({ fieldId: 'advance' }));
                if (advance.length != 0 && advance > 0) {
                    advance = advance / tipoCambio;
                    if (monto <= advance) {
                        monto = advance - monto;//! Pagado por completo
                        monto = 0;
                    } else {
                        monto = monto - advance;
                    }
                }

                let getCategoria = getDisponible(categoryPPTO, year, month, config.temporalidad); //! getDisponible (FUNCTION)
                let reservado = getReservado(categoryPPTO, year, month, config.temporalidad); //! getReservado (FUNCTION)
                resta = (getCategoria.disponible - reservado) - monto;
                console.log('Resta', resta + ' = (' + getCategoria.disponible + ' - ' + reservado + ') - ' + monto);
                if (resta < 0) {
                    view_alert = 1;
                    existe_ppto = 'Los siguientes centros de costo no tienen presupuesto disponible: ';
                    json2.push(' ' + getCategoria.categoria);
                    //console.log('No tiene ppto', json2)
                }
                objRecord.setValue('custbody_lh_categories_id_flag', monto);
                //console.log(json2)
                if (view_alert == 1) {
                    if (config.desviacion == DESVIACION_ADVERTENCIA) {
                        objRecord.setValue('custbody_lh_cp_estado_ppto_oc', RESERVADO);
                        //console.log('Advertencia, se guardó');
                        dialog.alert({
                            title: 'Advertencia',
                            message: existe_ppto + json2
                        }).then(success).catch(failure);
                        //return false;
                        return true;
                    } else if (config.desviacion == DESVIACION_BLOQUEO) {
                        //console.log('Bloqueo, no se guardó');
                        dialog.alert({
                            title: 'Bloqueo',
                            message: existe_ppto + json2
                        });
                        return false;
                    }
                } else if (view_alert == 0) {
                    return true;
                    //return false;
                }
            } else {
                dialog.alert({ title: 'Información', message: 'La subsidiaria no cuenta con una configuración de presupuesto.' });
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    }


    const controlPresupuestalIGEDIT = () => {
        const objRecord = currentRecord.get();
        let json = new Array();
        let json2 = new Array();
        let json3 = new Array();
        let resta = 0;
        let view_alert = 0;
        let existe_ppto = 'Tiene presupuesto';
        let cuenta = '';
        let account = 0;
        let category = 0;
        let subList = '';
        let vueltas = '';
        let articulo = '';
        let categoryEmpty = 0;
        let message = '';
        let message2 = '';
        let tipoCambio = 1;
        let scapeValidate = 0;
        let categoryid = 0;
        let sumamonto = 0;
        let categoryPPTO = '';


        try {
            //let transaction = objRecord.getValue({ fieldId: 'ntype' });
            //objRecord.setValue('custbody_lh_transaction_type_flag', transaction);
            let subsidiary = objRecord.getValue({ fieldId: 'subsidiary' });
            //let config = getConfig(transaction, subsidiary); //! getConfig (FUNCTION)
            //if (config != 0) {
            let currency = objRecord.getValue({ fieldId: 'currency' });
            // objRecord.setValue('custbody_lh_temporalidad_flag', config.temporalidad);
            // objRecord.setValue('custbody_lh_nivel_control_flag', config.nivelControl);
            let date = objRecord.getValue({ fieldId: 'trandate' });
            date = sysDate(date); //! sysDate (FUNCTION)
            let month = date.month;
            //let year = getAnioId(date.year); //! getAnioId (FUNCTION)
            //let department = objRecord.getValue({ fieldId: 'department' });
            // if (config.nivelControl == CATEGORIA_NIVEL_CONTROL) {
            //     category = objRecord.getValue({ fieldId: 'custbody_lh_cate_ppto_body' });
            //     if (category.length == 0) {
            //         message2 = 'Debe ingresar la categoría de presupuesto';
            //         dialog.alert({ title: 'Información', message: message2 });
            //         return false;
            //     }
            // }
            // objRecord.setValue('custbody_lh_anio_id_flag', year);
            if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                tipoCambio = getTipoCambio(subsidiary, month, date.year); //! getTipoCambio (FUNCTION)
                if (tipoCambio == 0) {
                    dialog.alert({ title: 'Información', message: 'No se encuentra un tipo de cambio para esta transacción' });
                    return false;
                }
            }
            let expLines = objRecord.getLineCount({ sublistId: 'expense' });
            subList = EXPENSE_SUBLIST;
            cuenta = 'account';
            vueltas = expLines;
            articulo = 'category';
            message = 'Las siguientes categorías no tienen una categoría de presupesto: ';
            //objRecord.setValue('custbody_lh_sublist_type_flag', subList);

            // categoryPPTO = getValidateCategoriaPPTO(subsidiary, department, category, account, config.nivelControl); //! getValidateCategoriaPPTO (FUNCTION)
            // if (categoryPPTO != 0) {
            //     objRecord.setValue('custbody_lh_ppto_flag_body', categoryPPTO);
            // } else {
            //     dialog.alert({ title: 'Información', message: message });
            //     return false;
            // }

            for (let i = 0; i < vueltas; i++) {
                let amount = parseFloat(objRecord.getSublistValue({ sublistId: subList, fieldId: 'amount', line: i }));
                sumamonto += amount;
            }

            // existe_ppto = 'Tiene presupuesto';
            let monto = sumamonto / tipoCambio;
            let thisMonto = parseFloat(objRecord.getValue('custbody_lh_amount_flag'));
            if (monto != thisMonto) {
                scapeValidate == 1
            }

            objRecord.setValue('custbody_lh_update_flag', scapeValidate);
            //objRecord.setValue('custbody_lh_amount_flag', monto);

            // let advance = parseFloat(objRecord.getValue({ fieldId: 'advance' }));
            // if (advance.length != 0 && advance > 0) {
            //     advance = advance / tipoCambio;
            //     if (monto <= advance) {
            //         monto = advance - monto;//! Pagado por completo
            //         monto = 0;
            //     } else {
            //         monto = monto - advance;
            //     }
            // }

            // let getCategoria = getDisponible(categoryPPTO, year, month, config.temporalidad); //! getDisponible (FUNCTION)
            // let reservado = getReservado(categoryPPTO, year, month, config.temporalidad); //! getReservado (FUNCTION)
            // resta = (getCategoria.disponible - reservado) - monto;
            // console.log('Resta', resta + ' = (' + getCategoria.disponible + ' - ' + reservado + ') - ' + monto);
            // if (resta < 0) {
            //     view_alert = 1;
            //     existe_ppto = 'Los siguientes centros de costo no tienen presupuesto disponible: ';
            //     json2.push(' ' + getCategoria.categoria);
            //     //console.log('No tiene ppto', json2)
            // }
            //objRecord.setValue('custbody_lh_categories_id_flag', monto);
            //console.log(json2)


            // if (view_alert == 1) {
            //     if (config.desviacion == DESVIACION_ADVERTENCIA) {
            //         objRecord.setValue('custbody_lh_cp_estado_ppto_oc', RESERVADO);
            //         //console.log('Advertencia, se guardó');
            //         dialog.alert({
            //             title: 'Advertencia',
            //             message: existe_ppto + json2
            //         }).then(success).catch(failure);
            //         //return false;
            //         return true;
            //     } else if (config.desviacion == DESVIACION_BLOQUEO) {
            //         //console.log('Bloqueo, no se guardó');
            //         dialog.alert({
            //             title: 'Bloqueo',
            //             message: existe_ppto + json2
            //         });
            //         return false;
            //     }
            // } else if (view_alert == 0) {
            //     return true;
            //     //return false;
            // }
            // } else {
            //     dialog.alert({ title: 'Información', message: 'La subsidiaria no cuenta con una configuración de presupuesto.' });
            // }
        } catch (error) {
            console.log(error);
            return false;
        }
    }


    function success(result) { console.log('Success: ' + result) }
    function failure(reason) { console.log('Failure: ' + reason) }


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

                    // if (amount < parseFloat(thisAmount) && amount != parseFloat(thisAmount)) {
                    //     console.log('amount < parseFloat(thisAmount) && amount != parseFloat(thisAmount)')
                    //     scapeValidate = 1;
                    //     break;
                    // } else if (amount > parseFloat(thisAmount) && amount != parseFloat(thisAmount)) {
                    //     scapeValidate = 2;
                    // }
                }
            }
            console.log('scapeValidate', scapeValidate);
            if (scapeValidate == 1) {
                context.currentRecord.setValue('approvalstatus', 1);
                retorno = controlPresupuestal();
            } else if (scapeValidate == 0 && estado != RESERVADO) {
                context.currentRecord.setValue('approvalstatus', 2);
            }
            context.currentRecord.setValue('custbody_lh_update_flag', scapeValidate);
            //retorno = false;
            return retorno;
        } catch (error) {
            console.log(error)
        }
    }


    const verifyChangesJE = (context, estado) => {
        const objRecord = currentRecord.get();
        let json = new Array();
        let json2 = new Array();
        let json3 = new Array();
        let json4 = new Array();
        let arrayNewCategories = new Array();
        let resta = 0;
        let view_alert = 0;
        let existe_ppto = 'Tiene presupuesto';
        let cuenta = '';
        let account = 0;
        let category = 0;
        let subList = '';
        let vueltas = '';
        let articulo = '';
        let categoryEmpty = 0;
        let message = '';
        let message2 = '';
        let tipoCambio = 1;
        let scapeValidate = 0;
        let categoryPPTO = '';
        let retorno = true;
        let paramConfig2 = '';

        try {
            let transaction = objRecord.getValue({ fieldId: 'ntype' });
            console.log('Type', transaction);
            let subsidiary = objRecord.getValue({ fieldId: 'subsidiary' });
            let currency = objRecord.getValue({ fieldId: 'currency' });
            let nivelControl = objRecord.getValue({ fieldId: 'custbody_lh_nivel_control_flag' });
            let temporalidad = objRecord.getValue({ fieldId: 'custbody_lh_temporalidad_flag' });
            let thisArrayCategorias = JSON.parse(objRecord.getValue({ fieldId: 'custbody_lh_categories_id_flag' }));
            console.log('thisArrayCategorias', thisArrayCategorias)
            let config = getConfig(transaction, subsidiary);
            let date = objRecord.getValue({ fieldId: 'trandate' });
            date = sysDate(date); //! sysDate (FUNCTION)
            let month = date.month;
            let year = getAnioId(date.year); //! getAnioId (FUNCTION)
            if (currency != CURRENCY_US_DOLLAR && currency != CURRENCY_CANADIAN_DOLLAR) {
                tipoCambio = getTipoCambio(subsidiary, month, date.year); //! getTipoCambio (FUNCTION)
                if (tipoCambio == 0) {
                    dialog.alert({ title: 'Información', message: 'No se encuentra un tipo de cambio para esta transacción' });
                    return false;
                }
            }
            let jouLines = objRecord.getLineCount({ sublistId: 'line' });
            if (jouLines > 0) {
                subList = JOURNAL_SUBLIST;
                cuenta = 'custcol_bm_itemaccount';
                vueltas = jouLines;
                articulo = 'account';
                message = 'Los siguientes cuentas no tienen una categoría de presupesto: ';
            }
            console.log('vueltas', vueltas);
            for (let i = 0; i < vueltas; i++) {
                let art = '';
                let aplicaPPTO = '';
                let amount = 0;
                let debit = 0;
                let credit = 0;
                let department = 0;
                let paramConfig = '';
                if (transaction == 1) {
                    aplicaPPTO = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcollh_aplica_ppto', line: i });
                    if (aplicaPPTO == true) {
                        art = objRecord.getSublistText({ sublistId: subList, fieldId: articulo, line: i });
                        debit = objRecord.getSublistValue({ sublistId: subList, fieldId: 'debit', line: i });
                        credit = objRecord.getSublistValue({ sublistId: subList, fieldId: 'credit', line: i });
                        if (debit.length != 0) {
                            amount = parseFloat(debit)
                        }

                        if (credit.length != 0) {
                            amount = parseFloat(-credit)
                        }
                        if (amount.length != 0) {
                            if (nivelControl == CECO_NIVEL_CONTROL) {
                                department = objRecord.getSublistValue({ sublistId: subList, fieldId: 'department', line: i });
                                paramConfig = department;
                            }

                            if (nivelControl == CUENTA_NIVEL_CONTROL) {
                                account = objRecord.getSublistValue({ sublistId: subList, fieldId: 'account', line: i });
                                paramConfig = account;
                            }

                            if (nivelControl == CATEGORIA_NIVEL_CONTROL) {
                                category = objRecord.getSublistValue({ sublistId: subList, fieldId: 'custcol_lh_categoria_ppto_oc', line: i });
                                paramConfig = category;
                            }

                            categoryPPTO = getValidateCategoriaPPTO(subsidiary, department, category, account, nivelControl); //! getValidateCategoriaPPTO (FUNCTION)
                            if (categoryPPTO != 0) {
                                json.push({
                                    category: categoryPPTO,
                                    amount: amount
                                });

                                json4.push({
                                    paramConfig: paramConfig,
                                    amount: amount
                                })
                            } else {
                                categoryEmpty = 1;
                                json3.push(' ' + art);
                            }
                        }
                    }
                }
            }

            let hash = {};
            json4 = json4.filter(o => hash[o.paramConfig] ? false : hash[o.paramConfig] = true);
            console.log('json4', json4);
            let categorias = json.map((x) => x.category);
            let arrayCategorias = [...new Set(categorias)];
            let arrayMontos = [];
            arrayCategorias.forEach((cat) => {
                let filtro = json.filter((x) => x.category == cat);
                let montos = filtro.reduce((acc, valor) => acc + valor.amount, 0);
                arrayMontos.push(montos);
            });
            console.log('arrayCategorias', arrayCategorias);
            console.log('arrayMontos', arrayMontos);

            for (let j in arrayCategorias) {
                let monto = parseFloat(arrayMontos[j]) / tipoCambio;
                let lookupFields = search.lookupFields({
                    type: DETALLE_TRANSACCION_RECORD,
                    id: thisArrayCategorias[j][0],//id detalle de transacción
                    columns: [
                        'custrecord_lh_cp_dt_centro_costo',
                        'custrecord_lh_cp_dt_nombre_categoria',
                        'custrecord_lh_cp_dt_cuenta_contable'
                    ]
                });
                if (nivelControl == CECO_NIVEL_CONTROL) {
                    paramConfig2 = lookupFields.custrecord_lh_cp_dt_centro_costo[0].value
                } else if (nivelControl == CATEGORIA_NIVEL_CONTROL) {
                    paramConfig2 = lookupFields.custrecord_lh_cp_dt_nombre_categoria[0].value
                } else if (nivelControl == CUENTA_NIVEL_CONTROL) {
                    paramConfig2 = lookupFields.custrecord_lh_cp_dt_cuenta_contable[0].value
                }

                arrayNewCategories.push([paramConfig2.toString(), monto]);
                console.log(json4[j].paramConfig + ' != ' + paramConfig2 + ' || ' + monto + ' != ' + parseFloat(thisArrayCategorias[j][1]))
                if (json4[j].paramConfig != paramConfig2 || monto != parseFloat(thisArrayCategorias[j][1])) {
                    console.log('Cambio por parámetro según cofiguración es diferente o montos diferentes');
                    scapeValidate = 1;
                    break;
                }
            }
            console.log('scapeValidate', scapeValidate);
            if (scapeValidate == 1) {
                context.currentRecord.setValue('custbody_lh_categories_id_edit_flag', JSON.stringify(arrayNewCategories));
                context.currentRecord.setValue('custbody_lh_update_flag', scapeValidate);
                for (let j in arrayCategorias) {
                    resta = 0;
                    let getCategoria = getDisponible(arrayCategorias[j], year, month, temporalidad); //! getDisponible (FUNCTION)
                    let reservado = getReservado(arrayCategorias[j], year, month, temporalidad); //! getReservado (FUNCTION)
                    let monto = parseFloat(arrayMontos[j]) / tipoCambio;
                    resta = (getCategoria.disponible - reservado) - monto;
                    //! 29k = 30k - 1K
                    console.log('Resta', resta + ' = (' + getCategoria.disponible + ' - ' + reservado + ') - ' + (parseFloat(arrayMontos[j]) / tipoCambio));
                    if (resta < 0) {
                        view_alert = 1;
                        existe_ppto = 'Los siguientes centros de costo no tienen presupuesto disponible: ';
                        json2.push(' ' + getCategoria.categoria);
                    }
                }
                //console.log(json2)
                if (view_alert == 1) {
                    if (config.desviacion == DESVIACION_ADVERTENCIA) {
                        //objRecord.setValue('custbody_lh_cp_estado_ppto_oc', RESERVADO);
                        //console.log('Advertencia, se guardó');
                        dialog.alert({
                            title: 'Advertencia',
                            message: existe_ppto + json2
                        }).then(success).catch(failure);
                        //return false;
                        return true;
                    } else if (config.desviacion == DESVIACION_BLOQUEO) {
                        //console.log('Bloqueo, no se guardó');
                        dialog.alert({
                            title: 'Bloqueo',
                            message: existe_ppto + json2
                        });
                        return false;
                    }
                } else if (view_alert == 0) {
                    return true;
                    //return false;
                }
            } else {
                console.log('No hubo cambios a nivel de impacto en ppto');
                context.currentRecord.setValue('custbody_lh_update_flag', scapeValidate);
                //retorno = false;
                return retorno;
            }
        } catch (error) {
            alert(error);
            console.log(error);
            return false;
        }
    }


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


    const getCategoriaPPTO = (subsidiary, department, account, nivelControl) => {
        try {
            let objSearch = search.load({ id: CATEGORIA_PRESUPUESTO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_cp_categoriap_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
            filters.push(filterOne);
            if (nivelControl == CUENTA_NIVEL_CONTROL) {
                const filterTwo = search.createFilter({ name: 'custrecord_lh_cp_cuenta', operator: search.Operator.ANYOF, values: account });
                filters.push(filterTwo);
            }
            const filterThree = search.createFilter({ name: 'custrecord_lh_cp_centro_costo', operator: search.Operator.ANYOF, values: department });
            filters.push(filterThree);

            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                let categoryId = result[0].getValue({ name: "internalid" });
                return categoryId;
            } else {
                return 0;
            }
        } catch (error) {
            console.log('Error-getCategoriaPPTO', error)
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


    const getDisponible = (category, year, month, temporalidad) => {
        let disponible = 0;
        let arregloTrimestre = 0;
        let suma = 0.0;
        let categoria = '';
        let cate = '';
        let ceco = '';
        //console.log('Mes', month);
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
            //console.log('searchResultCount', JSON.stringify(searchResultCount));
            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                //console.log(result);
                cecoText = result[0].getText({ name: "custrecord_lh_cp_centro_costo", join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA", });
                ceco = result[0].getValue({ name: "custrecord_lh_cp_centro_costo", join: "CUSTRECORD_LH_DETALLE_CPPTO_CATEGORIA", });
                cate = result[0].getValue({ name: "custrecord_lh_detalle_cppto_categoria" });

                if (temporalidad == TEMPORALIDAD_MENSUAL) {
                    disponible = parseFloat(result[0].getValue({ name: "custrecord_lh_detalle_cppto_" + month }));
                } else if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
                    //!const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
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
                    categoria: ceco,
                    cate: cate
                }
            } else {
                categoria = search.lookupFields({ type: CATEGORIA_PRESUPUESTO_RECORD, id: category, columns: ['custrecord_lh_cp_nombre_categoria'] });
                categoria = categoria.custrecord_lh_cp_nombre_categoria[0].text;
                cate = categoria.custrecord_lh_cp_nombre_categoria[0].value;
                return {
                    disponible: disponible,
                    categoria: cecoText,
                    cate: cate
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


    const getTipoCambio = (subsidiary, month, year) => {
        //* abr 2022,ago 2022,dic 2022,ene 2022,feb 2022,jul 2022,jun 2022,mar 2022,may 2022,nov 2022,oct 2022,sep 2022
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
        const filterTwo = search.createFilter({ name: 'custrecord_lh_tc_periodo', operator: search.Operator.ANYOF, values: internalidPeriod });
        filters.push(filterTwo);
        let searchResultCount = objSearch.runPaged().count;
        if (searchResultCount != 0) {
            let result = objSearch.run().getRange({ start: 0, end: 1 });
            let tipoCambio = parseFloat(result[0].getValue({ name: "custrecord_lh_tc_tipo_cambio" }));
            let periodo = result[0].getText({ name: "custrecord_lh_tc_periodo" });
            //console.log('Periodo',periodo);
            //console.log('Tipo Cambio', tipoCambio);
            return tipoCambio;
        } else {
            let objSearch = search.load({ id: TIPO_CAMBIO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_tc_subsidiaria', operator: search.Operator.ANYOF, values: subsidiary });
            filters.push(filterOne);
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount != 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                let tipoCambio = parseFloat(result[0].getValue({ name: "custrecord_lh_tc_tipo_cambio" }));
                let periodo = result[0].getText({ name: "custrecord_lh_tc_periodo" });
                //console.log('Periodo',periodo);
                //console.log('Tipo Cambio', tipoCambio);
                return tipoCambio;
            } else {
                return 0;
            }
        }
    }


    const getAccount = (item) => {
        let objItem = search.lookupFields({
            type: search.Type.ITEM,
            id: item,
            columns: ['expenseaccount']
        });
        //console.log('objItem', objItem);
        return objItem.expenseaccount[0].value;
    }


    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    }
});
