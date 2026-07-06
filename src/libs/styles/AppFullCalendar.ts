'use client'

import { styled } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

const AppFullCalendar = styled('div')(({ theme }: { theme: Theme }) => ({
  display: 'flex',
  width: '100%',
  position: 'relative',
  borderRadius: 'var(--mui-shape-borderRadius)',
  '& .fc': {
    zIndex: 1,
    width: '100%',
    '.fc-col-header, .fc-daygrid-body, .fc-scrollgrid-sync-table, .fc-timegrid-body, .fc-timegrid-body table, .fc-list, .fc-list-table': {
      width: '100% !important'
    },
    '& .fc-toolbar': {
      flexWrap: 'wrap',
      flexDirection: 'row !important',
      '&.fc-header-toolbar': {
        gap: theme.spacing(2),
        marginBottom: theme.spacing(6)
      },
      '& .fc-button-group:has(.fc-next-button)': {
        marginInlineStart: theme.spacing(2)
      },
      '& .fc-button': {
        padding: theme.spacing(),
        '&:active, .&:focus': { boxShadow: 'none' }
      },
      '.fc-prev-button, & .fc-next-button': {
        display: 'flex',
        backgroundColor: 'transparent',
        padding: theme.spacing(1.5),
        border: '0px',
        '& .fc-icon': {
          color: 'var(--mui-palette-text-primary)',
          fontSize: '1.25rem'
        },
        '&:hover, &:active, &:focus': {
          boxShadow: 'none !important',
          backgroundColor: 'transparent !important'
        }
      },
      '& .fc-toolbar-chunk:first-of-type': {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        rowGap: theme.spacing(2),
        [theme.breakpoints.down('md')]: {
          '& div:first-of-type': { display: 'flex', alignItems: 'center' }
        }
      },
      '& .fc-button-group': {
        '& .fc-button': {
          textTransform: 'capitalize',
          '&:focus': { boxShadow: 'none' }
        },
        '& .fc-button-primary': {
          '&:not(.fc-prev-button):not(.fc-next-button)': {
            ...theme.typography.button,
            textTransform: 'capitalize',
            backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
            padding: theme.spacing(1.75, 4),
            color: 'var(--mui-palette-primary-main)',
            borderColor: 'transparent',
            '&.fc-button-active, &:hover': {
              color: 'var(--mui-palette-primary-main)',
              backgroundColor: 'var(--mui-palette-primary-mainOpacity)'
            }
          }
        }
      },
      '& > * > :not(:first-of-type)': { marginLeft: 0 },
      '& .fc-toolbar-title': {
        marginInline: theme.spacing(4),
        ...theme.typography.h4
      },
      '.fc-button:empty, & .fc-toolbar-chunk:empty': { display: 'none' }
    },
    '& tbody td, & thead th': {
      borderColor: 'var(--mui-palette-divider)',
      '&.fc-col-header-cell': { borderLeft: 0, borderRight: 0 },
      '&[role="presentation"]': { borderInline: 0 }
    },
    '& colgroup col': { width: '60px !important' },
    '& .fc-event': {
      '& .fc-event-title-container, .fc-event-main-frame': { lineHeight: 1 },
      '&:not(.fc-list-event)': {
        '&.event-bg-primary': {
          border: 0,
          color: 'var(--mui-palette-primary-main)',
          backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
          '& .fc-event-title, & .fc-event-time': {
            fontSize: theme.typography.caption.fontSize,
            fontWeight: 500,
            color: 'var(--mui-palette-primary-main)',
            padding: 0
          }
        },
        '&.event-bg-success': {
          border: 0,
          color: 'var(--mui-palette-success-main)',
          backgroundColor: 'var(--mui-palette-success-lightOpacity)',
          '& .fc-event-title, & .fc-event-time': {
            fontSize: theme.typography.caption.fontSize,
            fontWeight: 500,
            color: 'var(--mui-palette-success-main)',
            padding: 0
          }
        },
        '&.event-bg-warning': {
          border: 0,
          color: 'var(--mui-palette-warning-main)',
          backgroundColor: 'var(--mui-palette-warning-lightOpacity)',
          '& .fc-event-title, & .fc-event-time': {
            fontSize: theme.typography.caption.fontSize,
            fontWeight: 500,
            color: 'var(--mui-palette-warning-main)',
            padding: 0
          }
        },
        '&.event-bg-error': {
          border: 0,
          color: 'var(--mui-palette-error-main)',
          backgroundColor: 'var(--mui-palette-error-lightOpacity)',
          '& .fc-event-title, & .fc-event-time': {
            fontSize: theme.typography.caption.fontSize,
            fontWeight: 500,
            color: 'var(--mui-palette-error-main)',
            padding: 0
          }
        },
        '&.event-bg-info': {
          border: 0,
          color: 'var(--mui-palette-info-main)',
          backgroundColor: 'var(--mui-palette-info-lightOpacity)',
          '& .fc-event-title, & .fc-event-time': {
            fontSize: theme.typography.caption.fontSize,
            fontWeight: 500,
            color: 'var(--mui-palette-info-main)',
            padding: 0
          }
        }
      },
      '&.event-bg-primary .fc-list-event-dot': {
        borderColor: 'var(--mui-palette-primary-main)',
        backgroundColor: 'var(--mui-palette-primary-main)'
      },
      '&.event-bg-success .fc-list-event-dot': {
        borderColor: 'var(--mui-palette-success-main)',
        backgroundColor: 'var(--mui-palette-success-main)'
      },
      '&.event-bg-warning .fc-list-event-dot': {
        borderColor: 'var(--mui-palette-warning-main)',
        backgroundColor: 'var(--mui-palette-warning-main)'
      },
      '&.event-bg-error .fc-list-event-dot': {
        borderColor: 'var(--mui-palette-error-main)',
        backgroundColor: 'var(--mui-palette-error-main)'
      },
      '&.event-bg-info .fc-list-event-dot': {
        borderColor: 'var(--mui-palette-info-main)',
        backgroundColor: 'var(--mui-palette-info-main)'
      },
      '&.fc-daygrid-event': { margin: 0, borderRadius: '500px' }
    },
    '& .fc-view-harness': {
      minHeight: '650px',
      margin: theme.spacing(0, -6),
      width: '100% !important'
    },
    '& .fc-col-header': {
      '& .fc-col-header-cell-cushion': {
        ...theme.typography.body1,
        fontWeight: 500,
        color: 'var(--mui-palette-text-primary)',
        padding: theme.spacing(2),
        textDecoration: 'none !important'
      }
    },
    '& .fc-scrollgrid-section-liquid > td': { borderBottom: 0 },
    '& .fc-daygrid-event-harness': {
      '& .fc-event': { padding: theme.spacing(1, 3), borderRadius: 4 },
      '&:not(:last-of-type) .fc-event': {
        marginBottom: `${theme.spacing(2.5)} !important`
      }
    },
    '& .fc-daygrid-day-bottom': { marginTop: theme.spacing(2.5) },
    '& .fc-daygrid-day': {
      padding: '8px',
      '& .fc-daygrid-day-top': { flexDirection: 'row' }
    },
    '& .fc-scrollgrid': {
      borderColor: 'var(--mui-palette-divider)',
      borderInline: 0
    },
    '& .fc-daygrid-day-events': {
      marginTop: theme.spacing(2.5),
      minHeight: '5rem !important'
    },
    '& .fc-day-other .fc-daygrid-day-top': {
      opacity: 1,
      '& .fc-daygrid-day-number': {
        color: 'var(--mui-palette-text-disabled) !important'
      }
    },
    '& .fc-daygrid-day-number, & .fc-timegrid-slot-label-cushion, & .fc-list-event-time': {
      textDecoration: 'none !important'
    },
    '& .fc-daygrid-day-number': {
      color: 'var(--mui-palette-text-secondary) !important',
      padding: 0
    },
    '& .fc-timegrid-slot-label-cushion, & .fc-list-event-time': {
      color: 'var(--mui-palette-text-primary) !important'
    },
    '& .fc-day-today:not(.fc-popover)': {
      backgroundColor: 'var(--mui-palette-action-hover)'
    },
    '& .fc-list': {
      border: 'none',
      width: '100% !important',
      '& .fc-list-day-cushion': {
        background: 'transparent',
        padding: theme.spacing(2, 4)
      },
      '.fc-list-event': {
        cursor: 'pointer',
        '& td': { borderColor: 'var(--mui-palette-divider)' }
      },
      '& .fc-list-event-graphic': { padding: theme.spacing(2) },
      '& .fc-list-day': {
        backgroundColor: 'var(--mui-palette-action-hover)',
        '& .fc-list-day-text, & .fc-list-day-side-text': {
          ...theme.typography.body1,
          fontWeight: 500,
          textDecoration: 'none'
        },
        '& > *': {
          background: 'none',
          borderColor: 'var(--mui-palette-divider)'
        }
      },
      '& .fc-list-event-title': {
        ...theme.typography.body1,
        color: 'var(--mui-palette-text-secondary) !important',
        padding: theme.spacing(2, 4, 2, 2)
      },
      '& .fc-list-event-time': {
        ...theme.typography.body1,
        color: 'var(--mui-palette-text-secondary) !important',
        padding: theme.spacing(2, 4)
      },
      '.fc-list-table tbody > tr:first-child th': {
        borderTop: '1px solid var(--mui-palette-divider)'
      },
      '.fc-list-table': {
        width: '100%',
        borderBottom: '1px solid var(--mui-palette-divider)'
      }
    },
    '& .fc-popover': {
      zIndex: 20,
      boxShadow: '1',
      borderColor: 'var(--mui-palette-divider)',
      borderRadius: 'var(--mui-shape-borderRadius)',
      background: 'var(--mui-palette-background-paper)',
      '& .fc-popover-header': {
        padding: theme.spacing(2),
        borderStartStartRadius: 'var(--mui-shape-borderRadius)',
        borderStartEndRadius: 'var(--mui-shape-borderRadius)',
        background: 'var(--mui-palette-action-hover)',
        '& .fc-popover-title, & .fc-popover-close': {
          color: 'var(--mui-palette-text-primary)'
        }
      }
    },
    [theme.breakpoints.up('md')]: {
      '& .fc-toolbar-title': { marginLeft: 0 }
    }
  }
}))

export default AppFullCalendar
