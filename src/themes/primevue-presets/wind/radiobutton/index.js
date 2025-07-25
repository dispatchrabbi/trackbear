export default {
    root: {
        class: [
            'relative',

            // Flexbox & Alignment
            'inline-flex',
            'align-bottom',

            // Size
            'w-4 h-4',

            // Misc
            'cursor-default',
            'select-none'
        ]
    },
    box: ({ props }) => ({
        class: [
            // Flexbox
            'flex justify-center items-center',

            // Size
            'w-4 h-4',
            'text-sm',
            'font-medium',

            // Shape
            'border-2',
            'rounded-full',

            // Transition
            'transition duration-200 ease-in-out',

            // Colors
            {
                'text-surface-700 dark:text-white/80': props.value !== props.modelValue && props.value !== undefined,
                'bg-surface-0 dark:bg-surface-900': props.value !== props.modelValue && props.value !== undefined,
                'border-surface-300 dark:border-surface-700': props.value !== props.modelValue && props.value !== undefined && !props.invalid,
                'border-primary-500 dark:border-primary-400': props.value == props.modelValue && props.value !== undefined
            },

            // Invalid State
            { 'border-error-500 dark:border-error-400': props.invalid },

            // States
            {
                'outline-none outline-offset-0': !props.disabled,
                'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-0 dark:focus-visible:ring-offset-surface-800 peer-focus-visible:ring-primary-500 dark:peer-focus-visible:ring-primary-400':
                    !props.disabled,
                'opacity-60 cursor-default': props.disabled
            }
        ]
    }),
    input: {
        class: [
            'peer',

            // Size
            'w-full ',
            'h-full',

            // Position
            'absolute',
            'top-0 left-0',
            'z-10',

            // Spacing
            'p-0',
            'm-0',

            // Shape
            'opacity-0',
            'rounded-md',
            'outline-none',
            'border-2 border-surface-300 dark:border-surface-700',

            // Misc
            'appearance-none',
            'cursor-default'
        ]
    },
    icon: ({ props, context }) => ({
        // this change actually means the radio button will look filled when checked
        class: [
            'w-0 h-0',
            'bg-primary-500 dark:bg-primary-400',
            'rounded-full',
            'transition-all duration-200 ease-in-out',
            { 'w-2 h-2': context.checked }
        ],
    })
};
