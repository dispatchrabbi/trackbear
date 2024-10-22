export default {
    root: ({ props }) => ({
        class: [
            //Font
            'text-xs font-bold',

            //Alignments
            'inline-flex items-center justify-center',

            //Spacing
            'px-2 py-1',

            //Shape
            {
                'rounded-md': !props.rounded,
                'rounded-full': props.rounded
            },

            //Colors
            {
                'bg-primary-500 dark:bg-primary-400 text-white dark:text-surface-900 ': props.severity == null || props.severity == 'primary',
                'bg-accent-500 dark:bg-accent-400 text-white dark:text-surface-900 ': props.severity == 'accent',
                'bg-success-500 dark:bg-success-400 text-white dark:text-surface-900 ': props.severity == 'success',
                'bg-info-500 dark:bg-info-400 text-white dark:text-surface-900 ': props.severity == 'info',
                'bg-help-500 dark:bg-help-400 text-white dark:text-surface-900 ': props.severity == 'help',
                'bg-warning-500 dark:bg-warning-400 text-white dark:text-surface-900 ': props.severity == 'warning',
                'bg-danger-500 dark:bg-danger-400 text-white dark:text-surface-900 ': props.severity == 'danger',
                'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200': props.severity == 'secondary',
                'bg-surface-800 dark:bg-surface-100 text-white dark:text-surface-900 ': props.severity == 'contrast',
            }
        ]
    }),
    value: {
        class: 'leading-normal'
    },
    icon: {
        class: 'mr-1 text-sm'
    }
};
