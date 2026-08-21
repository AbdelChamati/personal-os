const SAMPLE_TASKS = {
  'Study UiPath': {
    titleKey: 'taskSamples.studyUiPath.title',
    descriptionKey: 'taskSamples.studyUiPath.description',
  },
  'Buy groceries': {
    titleKey: 'taskSamples.buyGroceries.title',
    descriptionKey: 'taskSamples.buyGroceries.description',
  },
  'Plan tomorrow': {
    titleKey: 'taskSamples.planTomorrow.title',
    descriptionKey: 'taskSamples.planTomorrow.description',
  },
  'Call dentist for appointment': {
    titleKey: 'taskSamples.callDentist.title',
    descriptionKey: 'taskSamples.callDentist.description',
  },
  'Review budget': {
    titleKey: 'taskSamples.reviewBudget.title',
    descriptionKey: 'taskSamples.reviewBudget.description',
  },
};

export function getLocalizedTaskContent(task, t) {
  const sample = SAMPLE_TASKS[task.title];

  if (!sample) {
    return {
      title: task.title,
      description: task.description || '',
    };
  }

  return {
    title: t(sample.titleKey),
    description: task.description ? t(sample.descriptionKey) : '',
  };
}
