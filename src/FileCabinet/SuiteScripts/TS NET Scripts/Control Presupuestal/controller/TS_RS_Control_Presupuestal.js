/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/search', 'N/record'], (log, search, record) => {
    const CONFIG_PPTO_SEARCH = 'customsearch_co_config_presupuestal'; //CO Configuración Presupuestal Search - CP PRODUCCION
    const VENDOR_BILL = 'vendorbill';
    const VENDOR_CREDIT = 'vendorcredit';
    const JOURNAL_ENTRY = 'journalentry';

    const _get = (scriptContext) => {
        let recordParameter = scriptContext.recordParameter;
        let typeParameter = scriptContext.typeParameter;
        let ntypeParameter = scriptContext.ntypeParameter;
        let yearParameter = scriptContext.yearParameter;
        yearParameter = yearParameter.split('.')[0];
        log.debug('Parameters', recordParameter + ' - ' + typeParameter + ' - ' + ntypeParameter + ' - ' + yearParameter);
        try {
            let json = new Array();
            let config = getConfig(ntypeParameter);
            if (config == 1) {
                // log.debug('Config Exist', 'Si tiene una configuración');
                let objRecord = record.load({ type: typeParameter, id: recordParameter });
                let itemLines = objRecord.getLineCount({ sublistId: 'item' });
                let expLines = objRecord.getLineCount({ sublistId: 'expense' });

                if (itemLines > 0) {
                    for (let i = 0; i < itemLines; i++) {
                        let criterioControl = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'department', line: i });
                        if (criterioControl.length > 0) {
                            let categoria = getCategoria(criterioControl, yearParameter);
                            log.debug('Categoría', categoria);
                            if (categoria != 0) {
                                objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_ppto_flag', line: i, value: categoria });
                            }
                        }
                    }
                }

                if (expLines > 0) {
                    for (let i = 0; i < expLines; i++) {
                        let criterioControl = objRecord.getSublistValue({ sublistId: 'expense', fieldId: 'department', line: i });
                        let approval = objRecord.getSublistValue({ sublistId: 'expense', fieldId: 'custcol_lh_approval_status', line: i });
                        // log.debug('Approval', approval);
                        if (criterioControl.length > 0 && approval != 1) {
                            let categoria = getCategoria(criterioControl, yearParameter);
                            log.debug('Categoría', categoria);
                            if (categoria != 0) {
                                objRecord.setSublistValue({ sublistId: 'expense', fieldId: 'custcol_lh_ppto_flag', line: i, value: categoria });
                            }
                        }
                    }
                }

                recordParameter = objRecord.save();
                log.debug('Record Save', recordParameter);
            } else {
                log.debug('Config Exist', 'No tiene una configuración');
            }
            return typeParameter + ' ' + recordParameter + ' se está procesando - ' + 'Ntype ' + ntypeParameter + ' - ' + yearParameter;
        } catch (error) {
            log.error('Error', error)
        }
    }


    const getConfig = (transaction) => {
        try {
            let objSearch = search.load({ id: CONFIG_PPTO_SEARCH });
            let filters = objSearch.filters;
            const filterOne = search.createFilter({ name: 'custrecord_lh_cp_transaccion', operator: search.Operator.ANYOF, values: transaction });
            filters.push(filterOne);
            const filterThree = search.createFilter({ name: 'custrecord_lh_cp_flujo_aprobacion', operator: search.Operator.IS, values: true });
            filters.push(filterThree);
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount > 0) {
                return 1
            } else {
                return 0;
            }
        } catch (error) {
            log.error('Error-getConfig', error);
        }
    }


    const getCategoria = (criterioControl, year) => {
        let categoria = 0;
        const searchCategoria = search.create({
            type: "customrecord_lh_presupuesto_trimestral",
            filters:
                [
                    ["custrecord_lh_detalle_cppto_status_tr", "anyof", "1"],
                    "AND",
                    ["custrecord_lh_detalle_cppto_categoria_tr.custrecord_lh_cp_centro_costo", "anyof", criterioControl],
                    "AND",
                    ["custrecord_lh_detalle_cppto_anio_tr.name", "haskeywords", year]
                ],
            columns:
                [
                    search.createColumn({ name: "custrecord_lh_detalle_cppto_categoria_tr", label: "0 Categoría" })
                ]
        });

        let resultCount = searchCategoria.runPaged().count;
        if (resultCount != 0) {
            let result = searchCategoria.run().getRange({ start: 0, end: 1 });
            categoria = result[0].getValue(searchCategoria.columns[0]);
            //console.log(categoria + ' - ' + presupuesto);
        }
        return categoria;
    }

    const _post = (scriptContext) => { }
    const _put = (scriptContext) => { }
    const _delete = (scriptContext) => { }

    return {
        get: _get,
        // post: _post,
        // put: _put,
        // delete: _delete
    }
});
