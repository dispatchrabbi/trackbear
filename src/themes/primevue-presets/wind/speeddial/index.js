export default {
    root: {
        class: 'absolute flex'
    },
    button: {
        root: ({ props, context }) => ({
            class: [
                'relative',
                'z-20',

                // Alignments
                'items-center inline-flex text-center align-bottom justify-center',

                // Sizes & Spacing
                'leading-[normal]',
                'w-12 h-12 p-0 py-3',

                // Shapes
                'rounded-full',
                'shadow-md',

                // Link Button
                { 'text-primary-600 bg-transparent ring-transparent': props.link },

                // Plain Button
                { 'text-white bg-gray-500 ring-1 ring-gray-500': props.plain && !props.outlined && !props.text },
                // Plain Text Button
                { 'text-surface-500': props.plain && props.text },
                // Plain Outlined Button
                { 'text-surface-500 ring-1 ring-gray-500': props.plain && props.outlined },

                // Text Button
                { 'bg-transparent ring-transparent': props.text && !props.plain },

                // Outlined Button
                { 'bg-transparent': props.outlined && !props.plain },

                // --- Severity Buttons ---

                // Primary Button
                {
                    'text-white dark:text-surface-900': !props.link && props.severity === null && !props.text && !props.outlined && !props.plain,
                    'bg-primary-500 dark:bg-primary-400': !props.link && props.severity === null && !props.text && !props.outlined && !props.plain,
                    'ring-1 ring-primary-500 dark:ring-primary-400': !props.link && props.severity === null && !props.text && !props.outlined && !props.plain
                },
                // Primary Text Button
                { 'text-primary-500 dark:text-primary-400': props.text && props.severity === null && !props.plain },
                // Primary Outlined Button
                { 'text-primary-500 ring-1 ring-primary-500 hover:bg-primary-300/20': props.outlined && props.severity === null && !props.plain },

                // Secondary Button
                {
                    'text-white dark:text-surface-900': props.severity === 'secondary' && !props.text && !props.outlined && !props.plain,
                    'bg-surface-500 dark:bg-surface-400': props.severity === 'secondary' && !props.text && !props.outlined && !props.plain,
                    'ring-1 ring-surface-500 dark:ring-surface-400': props.severity === 'secondary' && !props.text && !props.outlined && !props.plain
                },
                // Secondary Text Button
                { 'text-surface-500 dark:text-surface-400': props.text && props.severity === 'secondary' && !props.plain },
                // Secondary Outlined Button
                { 'text-surface-500 ring-1 ring-surface-500 hover:bg-surface-300/20': props.outlined && props.severity === 'secondary' && !props.plain },

                // Success Button
                {
                    'text-white dark:text-success-900': props.severity === 'success' && !props.text && !props.outlined && !props.plain,
                    'bg-success-500 dark:bg-success-400': props.severity === 'success' && !props.text && !props.outlined && !props.plain,
                    'ring-1 ring-success-500 dark:ring-success-400': props.severity === 'success' && !props.text && !props.outlined && !props.plain
                },
                // Success Text Button
                { 'text-success-500 dark:text-success-400': props.text && props.severity === 'success' && !props.plain },
                // Success Outlined Button
                { 'text-success-500 ring-1 ring-success-500 hover:bg-success-300/20': props.outlined && props.severity === 'success' && !props.plain },

                // Info Button
                {
                    'text-white dark:text-surface-900': props.severity === 'info' && !props.text && !props.outlined && !props.plain,
                    'bg-info-500 dark:bg-info-400': props.severity === 'info' && !props.text && !props.outlined && !props.plain,
                    'ring-1 ring-info-500 dark:ring-info-400': props.severity === 'info' && !props.text && !props.outlined && !props.plain
                },
                // Info Text Button
                { 'text-info-500 dark:text-info-400': props.text && props.severity === 'info' && !props.plain },
                // Info Outlined Button
                { 'text-info-500 ring-1 ring-info-500 hover:bg-info-300/20 ': props.outlined && props.severity === 'info' && !props.plain },

                // Warning Button
                {
                    'text-white dark:text-surface-900': props.severity === 'warning' && !props.text && !props.outlined && !props.plain,
                    'bg-warning-500 dark:bg-warning-400': props.severity === 'warning' && !props.text && !props.outlined && !props.plain,
                    'ring-1 ring-warning-500 dark:ring-warning-400': props.severity === 'warning' && !props.text && !props.outlined && !props.plain
                },
                // Warning Text Button
                { 'text-warning-500 dark:text-warning-400': props.text && props.severity === 'warning' && !props.plain },
                // Warning Outlined Button
                { 'text-warning-500 ring-1 ring-warning-500 hover:bg-warning-300/20': props.outlined && props.severity === 'warning' && !props.plain },

                // Help Button
                {
                    'text-white dark:text-surface-900': props.severity === 'help' && !props.text && !props.outlined && !props.plain,
                    'bg-help-500 dark:bg-help-400': props.severity === 'help' && !props.text && !props.outlined && !props.plain,
                    'ring-1 ring-help-500 dark:ring-help-400': props.severity === 'help' && !props.text && !props.outlined && !props.plain
                },
                // Help Text Button
                { 'text-help-500 dark:text-help-400': props.text && props.severity === 'help' && !props.plain },
                // Help Outlined Button
                { 'text-help-500 ring-1 ring-help-500 hover:bg-help-300/20': props.outlined && props.severity === 'help' && !props.plain },

                // Danger Button
                {
                    'text-white dark:text-surface-900': props.severity === 'danger' && !props.text && !props.outlined && !props.plain,
                    'bg-danger-500 dark:bg-danger-400': props.severity === 'danger' && !props.text && !props.outlined && !props.plain,
                    'ring-1 ring-danger-500 dark:ring-danger-400': props.severity === 'danger' && !props.text && !props.outlined && !props.plain
                },
                // Danger Text Button
                { 'text-danger-500 dark:text-danger-400': props.text && props.severity === 'danger' && !props.plain },
                // Danger Outlined Button
                { 'text-danger-500 ring-1 ring-danger-500 hover:bg-danger-300/20': props.outlined && props.severity === 'danger' && !props.plain },

                // --- Severity Button States ---
                'focus:outline-none focus:outline-offset-0 focus:ring-2 focus:ring-offset-current',
                { 'focus:ring-offset-2': !props.link && !props.plain && !props.outlined && !props.text },

                // Link
                { 'focus:ring-primary-500 dark:focus:ring-primary-400': props.link },

                // Plain
                { 'hover:bg-gray-600 hover:ring-gray-600': props.plain && !props.outlined && !props.text },
                // Text & Outlined Button
                { 'hover:bg-surface-300/20': props.plain && (props.text || props.outlined) },

                // Primary
                { 'hover:bg-primary-600 dark:hover:bg-primary-300 hover:ring-primary-600 dark:hover:ring-primary-300': !props.link && props.severity === null && !props.text && !props.outlined && !props.plain },
                { 'focus:ring-primary-500 dark:focus:ring-primary-400': props.severity === null },
                // Text & Outlined Button
                { 'hover:bg-primary-300/20': (props.text || props.outlined) && props.severity === null && !props.plain },

                // Secondary
                { 'hover:bg-surface-600 dark:hover:bg-surface-300 hover:ring-surface-600 dark:hover:ring-surface-300': props.severity === 'secondary' && !props.text && !props.outlined && !props.plain },
                { 'focus:ring-surface-500 dark:focus:ring-surface-400': props.severity === 'secondary' },
                // Text & Outlined Button
                { 'hover:bg-surface-300/20': (props.text || props.outlined) && props.severity === 'secondary' && !props.plain },

                // Success
                { 'hover:bg-success-600 dark:hover:bg-success-300 hover:ring-success-600 dark:hover:ring-success-300': props.severity === 'success' && !props.text && !props.outlined && !props.plain },
                { 'focus:ring-success-500 dark:focus:ring-success-400': props.severity === 'success' },
                // Text & Outlined Button
                { 'hover:bg-success-300/20': (props.text || props.outlined) && props.severity === 'success' && !props.plain },

                // Info
                { 'hover:bg-info-600 dark:hover:bg-info-300 hover:ring-info-600 dark:hover:ring-info-300': props.severity === 'info' && !props.text && !props.outlined && !props.plain },
                { 'focus:ring-info-500 dark:focus:ring-info-400': props.severity === 'info' },
                // Text & Outlined Button
                { 'hover:bg-info-300/20': (props.text || props.outlined) && props.severity === 'info' && !props.plain },

                // Warning
                { 'hover:bg-warning-600 dark:hover:bg-warning-300 hover:ring-warning-600 dark:hover:ring-warning-300': props.severity === 'warning' && !props.text && !props.outlined && !props.plain },
                { 'focus:ring-warning-500 dark:focus:ring-warning-400': props.severity === 'warning' },
                // Text & Outlined Button
                { 'hover:bg-warning-300/20': (props.text || props.outlined) && props.severity === 'warning' && !props.plain },

                // Help
                { 'hover:bg-help-600 dark:hover:bg-help-300 hover:ring-help-600 dark:hover:ring-help-300': props.severity === 'help' && !props.text && !props.outlined && !props.plain },
                { 'focus:ring-help-500 dark:focus:ring-help-400': props.severity === 'help' },
                // Text & Outlined Button
                { 'hover:bg-help-300/20': (props.text || props.outlined) && props.severity === 'help' && !props.plain },

                // Danger
                { 'hover:bg-danger-600 dark:hover:bg-danger-300 hover:ring-danger-600 dark:hover:ring-danger-300': props.severity === 'danger' && !props.text && !props.outlined && !props.plain },
                { 'focus:ring-danger-500 dark:focus:ring-danger-400': props.severity === 'danger' },
                // Text & Outlined Button
                { 'hover:bg-danger-300/20': (props.text || props.outlined) && props.severity === 'danger' && !props.plain },

                // Disabled
                { 'opacity-60 pointer-events-none cursor-default': context.disabled },

                // Transitions
                'transition duration-200 ease-in-out',

                // Misc
                'cursor-pointer overflow-hidden select-none'
            ]
        }),
        label: ({ props }) => ({
            class: [
                'duration-200',
                'font-semibold',
                {
                    'hover:underline': props.link
                },
                { 'flex-1': props.label !== null, 'invisible w-0': props.label == null }
            ]
        }),
        icon: ({ props }) => ({
            class: [
                'mx-0',
                {
                    'mr-2': props.iconPos == 'left' && props.label != null,
                    'ml-2 order-1': props.iconPos == 'right' && props.label != null,
                    'mb-2': props.iconPos == 'top' && props.label != null,
                    'mt-2': props.iconPos == 'bottom' && props.label != null
                }
            ]
        }),
        loadingicon: ({ props }) => ({
            class: [
                'h-3 w-3',
                'mx-0',
                {
                    'mr-2': props.iconPos == 'left' && props.label != null,
                    'ml-2 order-1': props.iconPos == 'right' && props.label != null,
                    'mb-2': props.iconPos == 'top' && props.label != null,
                    'mt-2': props.iconPos == 'bottom' && props.label != null
                },
                'animate-spin'
            ]
        }),
        badge: ({ props }) => ({
            class: [{ 'ml-2 w-4 h-4 leading-none flex items-center justify-center': props.badge }]
        })
    },
    menu: {
        class: [
            // Spacing
            'm-0 p-0',

            // Layout & Flexbox
            'list-none flex items-center justify-center',

            // Transitions
            'transition delay-200',

            // Z-Index (Positioning)
            'z-20'
        ]
    },
    menuitem: ({ props, context }) => ({
        class: [
            'transform transition-transform duration-200 ease-out transition-opacity duration-800',

            // Conditional Appearance
            context.hidden ? 'opacity-0 scale-0' : 'opacity-100 scale-100',

            // Conditional Spacing
            {
                'my-1 first:mb-2': props.direction == 'up' && props.type == 'linear',
                'my-1 first:mt-2': props.direction == 'down' && props.type == 'linear',
                'mx-1 first:mr-2': props.direction == 'left' && props.type == 'linear',
                'mx-1 first:ml-2': props.direction == 'right' && props.type == 'linear'
            },

            // Conditional Positioning
            { absolute: props.type !== 'linear' }
        ]
    }),
    action: {
        class: [
            // Flexbox & Alignment
            'flex items-center justify-center',

            // Size
            'w-12 h-12',

            // Shape
            'rounded-full relative overflow-hidden',

            // Appearance
            'bg-surface-600 dark:bg-surface-0/80 text-white dark:text-surface-900/80',

            // Hover Effects
            'hover:bg-surface-700 dark:hover:bg-surface-200/80'
        ]
    },
    mask: ({ state }) => ({
        class: [
            // Base Styles
            'absolute left-0 top-0 w-full h-full transition-opacity duration-250 ease-in-out bg-surface-900/40 backdrop-blur-sm z-0',

            // Conditional Appearance
            {
                'opacity-0 pointer-events-none': !state.d_visible,
                'opacity-100 transition-opacity duration-400 ease-in-out': state.d_visible
            }
        ]
    })
};
