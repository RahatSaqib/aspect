import React from 'react'

const AspectWidgetGroup = props => {
  console.log(props)

  return <div>Group!</div>
  //   const { link, icon, count, extra } = props.widget;
  //   const description = formatMessage(
  //     'description',
  //     widget,
  //     intl,
  //     defaultMessages
  //   );
  //   return (
  //     <AspectLink
  //       to={widget.link}
  //       className={cssClasses('Summary', {
  //         'Summary_Link--disabled': !widget.link
  //       })}
  //       testId="SummaryStatus--Summary_Link"
  //     >
  //       <Card className={cssClasses('Summary__Card')}>
  //         <div className={cssClasses('Summary__Card__Title')}>
  //           <IconProvider icon={widget.icon} className="summaryCard__icon" />
  //           <span className={cssClasses('Summary__Card__Title--main')}>
  //             {formatMessage('title', widget, intl, defaultMessages)}

  //             <span className={cssClasses('Summary__Card__Title--sub')}>
  //               {formatMessage('subTitle', widget, intl, defaultMessages)}
  //             </span>
  //           </span>
  //           {description ? (
  //             <AspectTooltip showHelpIcon title={description} />
  //           ) : null}
  //         </div>
  //         <div className={cssClasses('Summary__Card__Content')}>
  //           <div className={cssClasses('Summary__Card__Item')}>
  //             <div className={cssClasses('Summary__Card__Item__Count')}>
  //               {widget.count}
  //             </div>
  //             <div className={cssClasses('Summary__Card__Item__Messages')}>
  //               <div
  //                 className={cssClasses('Summary__Card__Item__Messages--main')}
  //               >
  //                 {formatMessage('statUnit', widget, intl, defaultMessages)}
  //               </div>
  //               <div className={cssClasses('Summary__Card__Item__Messages--sub')}>
  //                 {formatMessage('statStatus', widget, intl, defaultMessages)}
  //               </div>
  //             </div>
  //           </div>
  //           <div className={cssClasses('Summary__Card__Item--right')}>
  //             <div className={cssClasses('Summary__Card__Item__Messages')}>
  //               <div
  //                 className={cssClasses('Summary__Card__Item__Messages--main')}
  //               >
  //                 {widget.extra}
  //                 {formatMessage('extraUnit', widget, intl, defaultMessages)}
  //               </div>
  //               <div className={cssClasses('Summary__Card__Item__Messages--sub')}>
  //                 {formatMessage('extraLabel', widget, intl, defaultMessages)}
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </Card>
  //     </AspectLink>
  //   );
}

export default AspectWidgetGroup
