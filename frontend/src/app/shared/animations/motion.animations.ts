import { animate, query, stagger, style, transition, trigger } from '@angular/animations';

export const springIn = trigger('springIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(14px) scale(0.98)' }),
    animate(
      '460ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({ opacity: 1, transform: 'translateY(0) scale(1)' })
    )
  ])
]);

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('320ms ease-out', style({ opacity: 1 }))
  ])
]);

export const staggerList = trigger('staggerList', [
  transition('* => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(10px) scale(0.98)' }),
        stagger(
          65,
          animate(
            '420ms cubic-bezier(0.22, 1, 0.36, 1)',
            style({ opacity: 1, transform: 'translateY(0) scale(1)' })
          )
        )
      ],
      { optional: true }
    )
  ])
]);
