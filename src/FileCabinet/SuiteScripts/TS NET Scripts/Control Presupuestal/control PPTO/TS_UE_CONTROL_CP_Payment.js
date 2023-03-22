/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/task'], (log, search, task) => {
    const RESERVADO = 2;
    const COMPROMETIDO = 3;
    const EJECUTADO = 4;
    const PAGADO = 5;
    const TRANSFERIDO = 6;
    const DISPONIBLE = 7;
    const beforeLoad = (context) => { }

    function beforeSubmit(context) {

    }

    const afterSubmit = (context) => {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            log.debug('Debug', context.newRecord.id);
            try {
                const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                mrTask.scriptId = 'customscript_ts_ss_control_cp_payment';
                mrTask.deploymentId = 'customdeploy_ts_ss_control_cp_payment';
                mrTask.params = {
                    'custscript_cp_payment_recordid': context.newRecord.id,
                    'custscript_cp_payment_action': PAGADO
                }
                let taskToken = mrTask.submit();
                log.debug('Token', taskToken);
            } catch (error) {
                log.error('Error-Post', error);
            }
        }
    }

    return {
        //beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
