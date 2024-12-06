export default {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    root: ({ props, context }) => ({
        class: [
            // Font
            'font-medium',
            {
                'text-xs leading-[1.5rem]': props.size == null,
                'text-lg leading-[2.25rem]': props.size == 'large',
                'text-2xl leading-[3rem]': props.size == 'xlarge'
            },

            // Alignment
            'text-center inline-block',

            // Size
            'p-0 px-1',
            {
                'min-w-[1.5rem] h-[1.5rem]': props.size == null,
                'min-w-[2.25rem] h-[2.25rem]': props.size == 'large',
                'min-w-[3rem] h-[3rem]': props.size == 'xlarge'
            },

            // Shape
            {
                'rounded-full': props.value.length == 1,
                'rounded-[0.71rem]': props.value.length !== 1
            },

            // Color
            'text-white dark:text-surface-900',
            {
                'bg-primary-500 dark:bg-primary-400': props.severity == null || props.severity == 'primary',
                'bg-surface-500 dark:bg-surface-400': props.severity == 'secondary',
                'bg-success-500 dark:bg-success-400': props.severity == 'success',
                'bg-info-500 dark:bg-info-400': props.severity == 'info',
                'bg-warning-500 dark:bg-warning-400': props.severity == 'warning',
                'bg-help-500 dark:bg-help-400': props.severity == 'help',
                'bg-danger-500 dark:bg-danger-400': props.severity == 'danger'
            }
        ]
    })
};
