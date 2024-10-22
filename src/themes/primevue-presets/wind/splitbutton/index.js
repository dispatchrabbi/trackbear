export default {
    root: ({ props }) => ({
        class: [
            // Flexbox and Position
            'inline-flex',
            'relative',

            // Shape
            'rounded-md',
            { 'shadow-lg': props.raised }
        ]
    }),
    button: {
        root: ({ parent }) => ({
            class: [
                'relative',
                // Alignments
                'items-center inline-flex text-center align-bottom justify-center',

                // Sizes & Spacing
                'text-sm',
                {
                    'px-2.5 py-1.5 min-w-[2rem]': parent.props.size === null,
                    'px-2 py-1': parent.props.size === 'small',
                    'px-3 py-2': parent.props.size === 'large'
                },
                {
                    'min-w-8 p-0 py-1.5': parent.props.label == null && parent.props.icon !== null
                },

                // Shape
                'rounded-r-none',
                'border-r-0',
                { 'rounded-l-full': parent.props.rounded },
                { 'rounded-md': !parent.props.rounded, 'rounded-full': parent.props.rounded },

                // Link Button
                { 'text-primary-600 bg-transparent ring-transparent': parent.props.link },

                // Plain Button
                { 'text-white bg-gray-500 ring-1 ring-gray-500': parent.props.plain && !parent.props.outlined && !parent.props.text },
                // Plain Text Button
                { 'text-surface-500': parent.props.plain && parent.props.text },
                // Plain Outlined Button
                { 'text-surface-500 ring-1 ring-gray-500': parent.props.plain && parent.props.outlined },

                // Text Button
                { 'bg-transparent ring-transparent': parent.props.text && !parent.props.plain },

                // Outlined Button
                { 'bg-transparent': parent.props.outlined && !parent.props.plain },

                // --- Severity Buttons ---

                // Primary Button
                {
                    'text-white dark:text-surface-900': !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-primary-500 dark:bg-primary-400': !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-primary-500 dark:ring-primary-400': !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Primary Text Button
                { 'text-primary-500 dark:text-primary-400': parent.props.text && parent.props.severity === null && !parent.props.plain },
                // Primary Outlined Button
                { 'text-primary-500 ring-1 ring-primary-500 hover:bg-primary-300/20': parent.props.outlined && parent.props.severity === null && !parent.props.plain },

                // Secondary Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'secondary' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-surface-500 dark:bg-surface-400': parent.props.severity === 'secondary' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-surface-500 dark:ring-surface-400': parent.props.severity === 'secondary' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Secondary Text Button
                { 'text-surface-500 dark:text-surface-400': parent.props.text && parent.props.severity === 'secondary' && !parent.props.plain },
                // Secondary Outlined Button
                { 'text-surface-500 ring-1 ring-surface-500 hover:bg-surface-300/20': parent.props.outlined && parent.props.severity === 'secondary' && !parent.props.plain },

                // Success Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'success' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-success-500 dark:bg-success-400': parent.props.severity === 'success' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-success-500 dark:ring-success-400': parent.props.severity === 'success' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Success Text Button
                { 'text-surface-500 dark:text-surface-400': parent.props.text && parent.props.severity === 'secondary' && !parent.props.plain },
                // Success Outlined Button
                { 'text-success-500 ring-1 ring-success-500 hover:bg-success-300/20': parent.props.outlined && parent.props.severity === 'success' && !parent.props.plain },

                // Info Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'info' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-info-500 dark:bg-info-400': parent.props.severity === 'info' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-info-500 dark:ring-info-400': parent.props.severity === 'info' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Info Text Button
                { 'text-info-500 dark:text-info-400': parent.props.text && parent.props.severity === 'info' && !parent.props.plain },
                // Info Outlined Button
                { 'text-info-500 ring-1 ring-info-500 hover:bg-info-300/20 ': parent.props.outlined && parent.props.severity === 'info' && !parent.props.plain },

                // Warning Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'warning' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-warning-500 dark:bg-warning-400': parent.props.severity === 'warning' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-warning-500 dark:ring-warning-400': parent.props.severity === 'warning' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Warning Text Button
                { 'text-warning-500 dark:text-warning-400': parent.props.text && parent.props.severity === 'warning' && !parent.props.plain },
                // Warning Outlined Button
                { 'text-warning-500 ring-1 ring-warning-500 hover:bg-warning-300/20': parent.props.outlined && parent.props.severity === 'warning' && !parent.props.plain },

                // Help Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'help' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-help-500 dark:bg-help-400': parent.props.severity === 'help' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-help-500 dark:ring-help-400': parent.props.severity === 'help' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Help Text Button
                { 'text-help-500 dark:text-help-400': parent.props.text && parent.props.severity === 'help' && !parent.props.plain },
                // Help Outlined Button
                { 'text-help-500 ring-1 ring-help-500 hover:bg-help-300/20': parent.props.outlined && parent.props.severity === 'help' && !parent.props.plain },

                // Danger Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'danger' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-danger-500 dark:bg-danger-400': parent.props.severity === 'danger' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-danger-500 dark:ring-danger-400': parent.props.severity === 'danger' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Danger Text Button
                { 'text-danger-500 dark:text-danger-400': parent.props.text && parent.props.severity === 'danger' && !parent.props.plain },
                // Danger Outlined Button
                { 'text-danger-500 ring-1 ring-danger-500 hover:bg-danger-300/20': parent.props.outlined && parent.props.severity === 'danger' && !parent.props.plain },

                // --- Severity Button States ---
                'focus:outline-none focus:outline-offset-0 focus:ring-2 focus:ring-offset-current',
                { 'focus:ring-offset-2': !parent.props.link && !parent.props.plain && !parent.props.outlined && !parent.props.text },

                // Link
                { 'focus:ring-primary-500 dark:focus:ring-primary-400': parent.props.link },

                // Plain
                { 'hover:bg-gray-600 hover:ring-gray-600': parent.props.plain && !parent.props.outlined && !parent.props.text },
                // Text & Outlined Button
                { 'hover:bg-surface-300/20': parent.props.plain && (parent.props.text || parent.props.outlined) },

                // Primary
                { 'hover:bg-primary-600 dark:hover:bg-primary-300 hover:ring-primary-600 dark:hover:ring-primary-300': !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-primary-500 dark:focus:ring-primary-400': parent.props.severity === null },
                // Text & Outlined Button
                { 'hover:bg-primary-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === null && !parent.props.plain },

                // Secondary
                { 'hover:bg-surface-600 dark:hover:bg-surface-300 hover:ring-surface-600 dark:hover:ring-surface-300': parent.props.severity === 'secondary' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-surface-500 dark:focus:ring-surface-400': parent.props.severity === 'secondary' },
                // Text & Outlined Button
                { 'hover:bg-surface-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'secondary' && !parent.props.plain },

                // Success
                { 'hover:bg-success-600 dark:hover:bg-success-300 hover:ring-success-600 dark:hover:ring-success-300': parent.props.severity === 'success' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-success-500 dark:focus:ring-success-400': parent.props.severity === 'success' },
                // Text & Outlined Button
                { 'hover:bg-success-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'success' && !parent.props.plain },

                // Info
                { 'hover:bg-info-600 dark:hover:bg-info-300 hover:ring-info-600 dark:hover:ring-info-300': parent.props.severity === 'info' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-info-500 dark:focus:ring-info-400': parent.props.severity === 'info' },
                // Text & Outlined Button
                { 'hover:bg-info-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'info' && !parent.props.plain },

                // Warning
                { 'hover:bg-warning-600 dark:hover:bg-warning-300 hover:ring-warning-600 dark:hover:ring-warning-300': parent.props.severity === 'warning' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-warning-500 dark:focus:ring-warning-400': parent.props.severity === 'warning' },
                // Text & Outlined Button
                { 'hover:bg-warning-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'warning' && !parent.props.plain },

                // Help
                { 'hover:bg-help-600 dark:hover:bg-help-300 hover:ring-help-600 dark:hover:ring-help-300': parent.props.severity === 'help' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-help-500 dark:focus:ring-help-400': parent.props.severity === 'help' },
                // Text & Outlined Button
                { 'hover:bg-help-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'help' && !parent.props.plain },

                // Warning
                { 'hover:bg-danger-600 dark:hover:bg-danger-300 hover:ring-danger-600 dark:hover:ring-danger-300': parent.props.severity === 'danger' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-danger-500 dark:focus:ring-danger-400': parent.props.severity === 'danger' },
                // Text & Outlined Button
                { 'hover:bg-danger-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'danger' && !parent.props.plain },

                // Transitions
                'transition duration-200 ease-in-out',

                // Misc
                'cursor-pointer overflow-hidden select-none'
            ]
        }),
        icon: {
            class: [
                // Margins
                'mr-2'
            ]
        }
    },
    menubutton: {
        root: ({ parent }) => ({
            class: [
                'relative',

                // Alignments
                'items-center inline-flex text-center align-bottom justify-center',

                // Sizes & Spacing
                'text-sm',
                {
                    'px-2.5 py-1.5 min-w-[2rem]': parent.props.size === null,
                    'px-2 py-1': parent.props.size === 'small',
                    'px-3 py-2': parent.props.size === 'large'
                },
                {
                    'min-w-8 p-0 py-1.5': parent.props.label == null && parent.props.icon !== null
                },
                'ml-[1px]',

                // Shape
                'rounded-l-none',
                { 'rounded-l-full': parent.props.rounded },
                { 'rounded-md': !parent.props.rounded, 'rounded-full': parent.props.rounded },

                // Link Button
                { 'text-primary-600 bg-transparent ring-transparent': parent.props.link },

                // Plain Button
                { 'text-white bg-gray-500 ring-1 ring-gray-500': parent.props.plain && !parent.props.outlined && !parent.props.text },
                // Plain Text Button
                { 'text-surface-500': parent.props.plain && parent.props.text },
                // Plain Outlined Button
                { 'text-surface-500 ring-1 ring-gray-500': parent.props.plain && parent.props.outlined },

                // Text Button
                { 'bg-transparent ring-transparent': parent.props.text && !parent.props.plain },

                // Outlined Button
                { 'bg-transparent': parent.props.outlined && !parent.props.plain },

                // --- Severity Buttons ---

                // Primary Button
                {
                    'text-white dark:text-surface-900': !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-primary-500 dark:bg-primary-400': !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-primary-500 dark:ring-primary-400': !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Primary Text Button
                { 'text-primary-500 dark:text-primary-400': parent.props.text && parent.props.severity === null && !parent.props.plain },
                // Primary Outlined Button
                { 'text-primary-500 ring-1 ring-primary-500 hover:bg-primary-300/20': parent.props.outlined && parent.props.severity === null && !parent.props.plain },

                // Secondary Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'secondary' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-surface-500 dark:bg-surface-400': parent.props.severity === 'secondary' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-surface-500 dark:ring-surface-400': parent.props.severity === 'secondary' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Secondary Text Button
                { 'text-surface-500 dark:text-surface-400': parent.props.text && parent.props.severity === 'secondary' && !parent.props.plain },
                // Secondary Outlined Button
                { 'text-surface-500 ring-1 ring-surface-500 hover:bg-surface-300/20': parent.props.outlined && parent.props.severity === 'secondary' && !parent.props.plain },

                // Success Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'success' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-success-500 dark:bg-success-400': parent.props.severity === 'success' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-success-500 dark:ring-success-400': parent.props.severity === 'success' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Success Text Button
                { 'text-surface-500 dark:text-surface-400': parent.props.text && parent.props.severity === 'secondary' && !parent.props.plain },
                // Success Outlined Button
                { 'text-success-500 ring-1 ring-success-500 hover:bg-success-300/20': parent.props.outlined && parent.props.severity === 'success' && !parent.props.plain },

                // Info Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'info' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-info-500 dark:bg-info-400': parent.props.severity === 'info' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-info-500 dark:ring-info-400': parent.props.severity === 'info' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Info Text Button
                { 'text-info-500 dark:text-info-400': parent.props.text && parent.props.severity === 'info' && !parent.props.plain },
                // Info Outlined Button
                { 'text-info-500 ring-1 ring-info-500 hover:bg-info-300/20 ': parent.props.outlined && parent.props.severity === 'info' && !parent.props.plain },

                // Warning Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'warning' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-warning-500 dark:bg-warning-400': parent.props.severity === 'warning' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-warning-500 dark:ring-warning-400': parent.props.severity === 'warning' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Warning Text Button
                { 'text-warning-500 dark:text-warning-400': parent.props.text && parent.props.severity === 'warning' && !parent.props.plain },
                // Warning Outlined Button
                { 'text-warning-500 ring-1 ring-warning-500 hover:bg-warning-300/20': parent.props.outlined && parent.props.severity === 'warning' && !parent.props.plain },

                // Help Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'help' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-help-500 dark:bg-help-400': parent.props.severity === 'help' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-help-500 dark:ring-help-400': parent.props.severity === 'help' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Help Text Button
                { 'text-help-500 dark:text-help-400': parent.props.text && parent.props.severity === 'help' && !parent.props.plain },
                // Help Outlined Button
                { 'text-help-500 ring-1 ring-help-500 hover:bg-help-300/20': parent.props.outlined && parent.props.severity === 'help' && !parent.props.plain },

                // Danger Button
                {
                    'text-white dark:text-surface-900': parent.props.severity === 'danger' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'bg-danger-500 dark:bg-danger-400': parent.props.severity === 'danger' && !parent.props.text && !parent.props.outlined && !parent.props.plain,
                    'ring-1 ring-danger-500 dark:ring-danger-400': parent.props.severity === 'danger' && !parent.props.text && !parent.props.outlined && !parent.props.plain
                },
                // Danger Text Button
                { 'text-danger-500 dark:text-danger-400': parent.props.text && parent.props.severity === 'danger' && !parent.props.plain },
                // Danger Outlined Button
                { 'text-danger-500 ring-1 ring-danger-500 hover:bg-danger-300/20': parent.props.outlined && parent.props.severity === 'danger' && !parent.props.plain },

                // --- Severity Button States ---
                'focus:outline-none focus:outline-offset-0 focus:ring-2 focus:ring-offset-current',
                { 'focus:ring-offset-2': !parent.props.link && !parent.props.plain && !parent.props.outlined && !parent.props.text },

                // Link
                { 'focus:ring-primary-500 dark:focus:ring-primary-400': parent.props.link },

                // Plain
                { 'hover:bg-gray-600 hover:ring-gray-600': parent.props.plain && !parent.props.outlined && !parent.props.text },
                // Text & Outlined Button
                { 'hover:bg-surface-300/20': parent.props.plain && (parent.props.text || parent.props.outlined) },

                // Primary
                { 'hover:bg-primary-600 dark:hover:bg-primary-300 hover:ring-primary-600 dark:hover:ring-primary-300': !parent.props.link && parent.props.severity === null && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-primary-500 dark:focus:ring-primary-400': parent.props.severity === null },
                // Text & Outlined Button
                { 'hover:bg-primary-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === null && !parent.props.plain },

                // Secondary
                { 'hover:bg-surface-600 dark:hover:bg-surface-300 hover:ring-surface-600 dark:hover:ring-surface-300': parent.props.severity === 'secondary' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-surface-500 dark:focus:ring-surface-400': parent.props.severity === 'secondary' },
                // Text & Outlined Button
                { 'hover:bg-surface-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'secondary' && !parent.props.plain },

                // Success
                { 'hover:bg-success-600 dark:hover:bg-success-300 hover:ring-success-600 dark:hover:ring-success-300': parent.props.severity === 'success' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-success-500 dark:focus:ring-success-400': parent.props.severity === 'success' },
                // Text & Outlined Button
                { 'hover:bg-success-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'success' && !parent.props.plain },

                // Info
                { 'hover:bg-info-600 dark:hover:bg-info-300 hover:ring-info-600 dark:hover:ring-info-300': parent.props.severity === 'info' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-info-500 dark:focus:ring-info-400': parent.props.severity === 'info' },
                // Text & Outlined Button
                { 'hover:bg-info-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'info' && !parent.props.plain },

                // Warning
                { 'hover:bg-warning-600 dark:hover:bg-warning-300 hover:ring-warning-600 dark:hover:ring-warning-300': parent.props.severity === 'warning' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-warning-500 dark:focus:ring-warning-400': parent.props.severity === 'warning' },
                // Text & Outlined Button
                { 'hover:bg-warning-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'warning' && !parent.props.plain },

                // Help
                { 'hover:bg-help-600 dark:hover:bg-help-300 hover:ring-help-600 dark:hover:ring-help-300': parent.props.severity === 'help' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-help-500 dark:focus:ring-help-400': parent.props.severity === 'help' },
                // Text & Outlined Button
                { 'hover:bg-help-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'help' && !parent.props.plain },

                // Warning
                { 'hover:bg-danger-600 dark:hover:bg-danger-300 hover:ring-danger-600 dark:hover:ring-danger-300': parent.props.severity === 'danger' && !parent.props.text && !parent.props.outlined && !parent.props.plain },
                { 'focus:ring-danger-500 dark:focus:ring-danger-400': parent.props.severity === 'danger' },
                // Text & Outlined Button
                { 'hover:bg-danger-300/20': (parent.props.text || parent.props.outlined) && parent.props.severity === 'danger' && !parent.props.plain },

                // Transitions
                'transition duration-200 ease-in-out',

                // Misc
                'cursor-pointer overflow-hidden select-none'
            ]
        }),
        label: {
            class: ['hidden']
        }
    },
    menu: {
        root: {
            class: [
                // Shape
                'rounded-md',

                // Size
                'min-w-[12rem]',
                'p-1.5',

                // Colors
                'bg-surface-0 dark:bg-surface-700',
                'ring-1 ring-surface-200 dark:ring-surface-700'
            ]
        },
        menu: {
            class: [
                // Spacings and Shape
                'list-none',
                'm-0',
                'p-0',
                'outline-none'
            ]
        },
        menuitem: {
            class: ['relative first:mt-0 mt-1']
        },
        content: ({ context }) => ({
            class: [
                //Shape
                'rounded-md',

                //  Colors
                {
                    'text-surface-500 dark:text-white/70': !context.focused && !context.active,
                    'text-surface-500 dark:text-white/70 bg-surface-200 dark:bg-black/70': context.focused && !context.active,
                    'text-surface-900 dark:text-surface-0/80 bg-surface-50 dark:bg-black/70': context.focused && context.active,
                    'text-surface-900 dark:text-surface-0/80 bg-surface-50 dark:bg-black/70': !context.focused && context.active
                },

                // Hover States
                {
                    'hover:bg-surface-50 dark:hover:bg-surface-800': !context.active,
                    'hover:bg-surface-100 dark:hover:bg-black/40 text-surface-900 dark:text-surface-0/80': context.active
                },

                // Transitions
                'transition-shadow',
                'duration-200'
            ]
        }),
        action: {
            class: [
                'relative',

                // Font
                'font-semibold',

                // Flexbox
                'flex',
                'items-center',

                // Spacing
                'py-2',
                'px-3',

                // Misc
                'no-underline',
                'overflow-hidden',
                'cursor-pointer',
                'select-none'
            ]
        },
        icon: {
            class: [
                // Spacing
                'mr-2',
                'leading-6',
                'text-sm'
            ]
        },
        label: {
            class: ['leading-none', 'text-sm']
        },
        submenuicon: {
            class: [
                // Position
                'ml-auto'
            ]
        },
        submenu: {
            class: [
                // Size
                'w-full sm:w-48',

                // Spacing
                'p-1.5',
                'm-0 mx-1.5',
                'list-none',

                // Shape
                'shadow-none sm:shadow-md',
                'border-0',

                // Position
                'static sm:absolute',
                'z-10',

                // Color
                'bg-surface-0 dark:bg-surface-700'
            ]
        },
        separator: {
            class: 'border-t border-surface-200 dark:border-surface-600 my-1'
        }
    }
};
