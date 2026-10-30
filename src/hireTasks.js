export const hireTasks = [
  { id: 'A', description: 'A Malaysian AI company wants you to test their product and leave a positive review on Product Hunt.', budget: 15, hours: 24 },
  { id: 'B', description: 'A Chinese smart AI companion toy brand wants you to represent them at a Tech Week event in San Francisco.', budget: 200, hours: 240 },
  { id: 'C', description: 'A Singaporean consulting company wants you to complete a survey.', budget: 10, hours: 12 }
];
export const getHireTask = id => hireTasks.find(task => task.id === id);
