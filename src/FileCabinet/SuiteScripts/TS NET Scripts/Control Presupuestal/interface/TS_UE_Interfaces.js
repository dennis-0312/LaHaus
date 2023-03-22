/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/ui/serverWidget'], (log, search, record, serverWidget) => {

    const beforeLoad = (scriptContext) => {
        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            const form = scriptContext.form;
            try {
                form.addTab({ id: 'custpage_tab_disponible', label: 'Disponible' });
                form.addSubtab({ id: 'custpage_subtab_mensual', label: 'Mensual', tab: 'custpage_tab_disponible' });
                form.addSubtab({ id: 'custpage_subtab_trimestral', label: 'Trimestral', tab: 'custpage_tab_disponible' });
                form.addField({
                    id: 'custpage_field_flag',
                    type: serverWidget.FieldType.DATE,
                    label: 'EN PROCESO DE IMPLEMENTACIÓN',
                    container: 'custpage_subtab_mensual'
                });

                let sublist2 = form.addSublist({
                    id: 'custpage_sublist2',
                    type: serverWidget.SublistType.LIST,
                    label: 'Trimestral',
                    tab: 'custpage_subtab_trimestral'
                });
                sublist2.addRefreshButton();

                sublist2.addField({
                    id: 'custpage_field_anio',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Año'
                });

                sublist2.addField({
                    id: 'custpage_field_trimestre_0',
                    type: serverWidget.FieldType.CURRENCY,
                    label: '1er Trimestre'
                });

                sublist2.addField({
                    id: 'custpage_field_trimestre_1',
                    type: serverWidget.FieldType.CURRENCY,
                    label: '2do Trimestre'
                });

                sublist2.addField({
                    id: 'custpage_field_trimestre_2',
                    type: serverWidget.FieldType.CURRENCY,
                    label: '3er Trimestre'
                });

                sublist2.addField({
                    id: 'custpage_field_trimestre_3',
                    type: serverWidget.FieldType.CURRENCY,
                    label: '4to Trimestre'
                });

                //*========================================================

                sublist2.setSublistValue({
                    id: 'custpage_field_anio',
                    line: 0,
                    value: '2023'
                });

                sublist2.setSublistValue({
                    id: 'custpage_field_trimestre_0',
                    line: 0,
                    value: 400
                });

                sublist2.setSublistValue({
                    id: 'custpage_field_trimestre_1',
                    line: 0,
                    value: 600
                });

                sublist2.setSublistValue({
                    id: 'custpage_field_trimestre_2',
                    line: 0,
                    value: 500
                });

                sublist2.setSublistValue({
                    id: 'custpage_field_trimestre_3',
                    line: 0,
                    value: 700
                });

            } catch (error) {
                log.debug('Error-BF', error);
            }
        }

    }


    const beforeSubmit = (scriptContext) => { }
    const afterSubmit = (scriptContext) => { }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    }
});
