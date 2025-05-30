export default {
    root: ({ context, props }) => ({
        class: [
            // Font
            'font-sans leading-6',

            // Spacing
            'm-0 py-1.5 px-3 sm:text-sm',

            // Colors
            'text-surface-900 dark:text-surface-0',
            'placeholder:text-surface-400 dark:placeholder:text-surface-500',
            'bg-surface-0 dark:bg-surface-900',
            'ring-1 ring-inset ring-offset-0',
            'shadow-sm',
            { 'ring-surface-300 dark:ring-surface-700': !props.invalid },

            // Invalid State
            { 'ring-error-500 dark:ring-error-400': props.invalid },

            // Shape
            'rounded-md',
            'appearance-none',

            // Interactions
            {
                'outline-none focus:ring-primary-500 dark:focus:ring-primary-400': !context.disabled,
                'opacity-60 select-none pointer-events-none cursor-default': context.disabled
            }
        ]
    })
};
