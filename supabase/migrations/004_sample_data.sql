-- Insert sample difficulty levels
INSERT INTO public.difficulty_levels (name, description, order_index) VALUES
('Beginner', 'Basic level questions for beginners', 1),
('Intermediate', 'Intermediate level questions', 2),
('Advanced', 'Advanced level questions for experienced learners', 3);

-- Insert sample categories
INSERT INTO public.categories (name, description) VALUES
('Grammar', 'English grammar questions covering tenses, parts of speech, and sentence structure'),
('Vocabulary', 'Word meanings, synonyms, antonyms, and usage'),
('Reading Comprehension', 'Understanding and analyzing written texts'),
('Listening', 'Audio-based questions for listening skills'),
('Writing', 'Writing skills and composition questions'),
('Speaking', 'Pronunciation and speaking-related questions');

-- Create sample users (these will be created when users register through auth)
-- We'll create them manually for testing purposes

-- Note: In production, users are created through Supabase Auth
-- This is just for testing with sample data

-- Insert sample questions for Grammar - Beginner
INSERT INTO public.questions (category_id, difficulty_id, question_text, explanation) VALUES
(1, 1, 'What is the correct form of the verb "to be" for the pronoun "I"?', 'The correct form of "to be" for "I" is "am". This is a basic rule in English grammar.'),
(1, 1, 'Which of the following is a noun?', 'A noun is a word that names a person, place, thing, or idea. "Book" is a thing, making it a noun.'),
(1, 1, 'What is the past tense of "go"?', 'The past tense of "go" is "went". This is an irregular verb form.'),
(1, 1, 'Which sentence is grammatically correct?', 'Subject-verb agreement requires singular subjects to have singular verbs and plural subjects to have plural verbs.'),
(1, 1, 'What type of word is "quickly"?', 'Words ending in "-ly" are typically adverbs, which modify verbs, adjectives, or other adverbs.');

-- Insert sample questions for Grammar - Intermediate
INSERT INTO public.questions (category_id, difficulty_id, question_text, explanation) VALUES
(1, 2, 'Which sentence uses the present perfect tense correctly?', 'Present perfect tense is formed with "have/has" + past participle and indicates an action that started in the past and continues to the present.'),
(1, 2, 'What is the correct passive voice form of "The teacher explains the lesson"?', 'In passive voice, the object becomes the subject, and we use "be" + past participle.'),
(1, 2, 'Which relative pronoun should be used: "The book _____ I read was interesting"?', 'When the relative pronoun is the object of the verb, "that" or "which" can be used, but "that" is more common in restrictive clauses.'),
(1, 2, 'Identify the type of conditional: "If it rains, I will stay home."', 'This is a first conditional, used for real possibilities in the future.'),
(1, 2, 'What is the correct form: "I wish I _____ more time"?', 'After "wish" for present situations, we use the past tense to express unreality.');

-- Insert sample questions for Vocabulary - Beginner
INSERT INTO public.questions (category_id, difficulty_id, question_text, explanation) VALUES
(2, 1, 'What does "happy" mean?', '"Happy" means feeling joy or pleasure; being in a good mood.'),
(2, 1, 'Which word is the opposite of "big"?', '"Small" is the antonym (opposite) of "big".'),
(2, 1, 'What is a synonym for "fast"?', 'A synonym is a word with the same or similar meaning. "Quick" means the same as "fast".'),
(2, 1, 'Which word means "a place where you sleep"?', 'A bedroom is specifically the room where you sleep.'),
(2, 1, 'What do you call the meal you eat in the morning?', 'Breakfast is the first meal of the day, eaten in the morning.');

-- Insert sample questions for Reading Comprehension - Beginner
INSERT INTO public.questions (category_id, difficulty_id, question_text, explanation) VALUES
(3, 1, 'Read: "The cat sat on the mat." Where did the cat sit?', 'The text clearly states that the cat sat "on the mat".'),
(3, 1, 'Read: "It is sunny today. Sarah wants to go to the park." Why does Sarah want to go to the park?', 'The context suggests Sarah wants to go to the park because of the sunny weather.'),
(3, 1, 'Read: "Tom has three apples. He gives one to his friend." How many apples does Tom have now?', 'Tom started with 3 apples and gave away 1, so he has 3 - 1 = 2 apples left.'),
(3, 1, 'Read: "The library is closed on Sundays." When is the library closed?', 'The text explicitly states the library is closed on Sundays.'),
(3, 1, 'Read: "Maria loves to read books. She reads every night before bed." When does Maria read?', 'The text states Maria reads "every night before bed".');

-- Insert options for Grammar - Beginner questions
INSERT INTO public.question_options (question_id, option_text, is_correct, order_index) VALUES
-- Question 1: What is the correct form of "to be" for "I"?
(1, 'am', true, 1),
(1, 'is', false, 2),
(1, 'are', false, 3),
(1, 'be', false, 4),

-- Question 2: Which is a noun?
(2, 'quickly', false, 1),
(2, 'book', true, 2),
(2, 'run', false, 3),
(2, 'beautiful', false, 4),

-- Question 3: Past tense of "go"
(3, 'goed', false, 1),
(3, 'went', true, 2),
(3, 'gone', false, 3),
(3, 'going', false, 4),

-- Question 4: Grammatically correct sentence
(4, 'The dogs runs fast', false, 1),
(4, 'The dog run fast', false, 2),
(4, 'The dog runs fast', true, 3),
(4, 'The dogs run fast', false, 4),

-- Question 5: Type of word "quickly"
(5, 'noun', false, 1),
(5, 'verb', false, 2),
(5, 'adjective', false, 3),
(5, 'adverb', true, 4);

-- Insert options for Grammar - Intermediate questions
INSERT INTO public.question_options (question_id, option_text, is_correct, order_index) VALUES
-- Question 6: Present perfect tense
(6, 'I am studying English for two years', false, 1),
(6, 'I study English for two years', false, 2),
(6, 'I have studied English for two years', true, 3),
(6, 'I studied English for two years', false, 4),

-- Question 7: Passive voice
(7, 'The lesson is explained by the teacher', true, 1),
(7, 'The lesson explains by the teacher', false, 2),
(7, 'The lesson was explaining by the teacher', false, 3),
(7, 'The teacher is explained the lesson', false, 4),

-- Question 8: Relative pronoun
(8, 'who', false, 1),
(8, 'whom', false, 2),
(8, 'that', true, 3),
(8, 'whose', false, 4),

-- Question 9: Type of conditional
(9, 'Zero conditional', false, 1),
(9, 'First conditional', true, 2),
(9, 'Second conditional', false, 3),
(9, 'Third conditional', false, 4),

-- Question 10: Wish structure
(10, 'have', false, 1),
(10, 'had', true, 2),
(10, 'will have', false, 3),
(10, 'would have', false, 4);

-- Insert options for Vocabulary - Beginner questions
INSERT INTO public.question_options (question_id, option_text, is_correct, order_index) VALUES
-- Question 11: Meaning of "happy"
(11, 'sad', false, 1),
(11, 'angry', false, 2),
(11, 'joyful', true, 3),
(11, 'tired', false, 4),

-- Question 12: Opposite of "big"
(12, 'large', false, 1),
(12, 'huge', false, 2),
(12, 'small', true, 3),
(12, 'tall', false, 4),

-- Question 13: Synonym for "fast"
(13, 'slow', false, 1),
(13, 'quick', true, 2),
(13, 'lazy', false, 3),
(13, 'tired', false, 4),

-- Question 14: Place where you sleep
(14, 'kitchen', false, 1),
(14, 'bathroom', false, 2),
(14, 'bedroom', true, 3),
(14, 'living room', false, 4),

-- Question 15: Morning meal
(15, 'lunch', false, 1),
(15, 'dinner', false, 2),
(15, 'breakfast', true, 3),
(15, 'snack', false, 4);

-- Insert options for Reading Comprehension - Beginner questions
INSERT INTO public.question_options (question_id, option_text, is_correct, order_index) VALUES
-- Question 16: Where did the cat sit?
(16, 'on the chair', false, 1),
(16, 'on the mat', true, 2),
(16, 'on the bed', false, 3),
(16, 'on the floor', false, 4),

-- Question 17: Why does Sarah want to go to the park?
(17, 'because it is raining', false, 1),
(17, 'because it is sunny', true, 2),
(17, 'because it is cold', false, 3),
(17, 'because it is windy', false, 4),

-- Question 18: How many apples does Tom have now?
(18, '1', false, 1),
(18, '2', true, 2),
(18, '3', false, 3),
(18, '4', false, 4),

-- Question 19: When is the library closed?
(19, 'Mondays', false, 1),
(19, 'Sundays', true, 2),
(19, 'Fridays', false, 3),
(19, 'Saturdays', false, 4),

-- Question 20: When does Maria read?
(20, 'in the morning', false, 1),
(20, 'at lunch', false, 2),
(20, 'every night before bed', true, 3),
(20, 'on weekends', false, 4);

-- Add more questions for other categories and difficulties
-- Vocabulary - Intermediate
INSERT INTO public.questions (category_id, difficulty_id, question_text, explanation) VALUES
(2, 2, 'What does "procrastinate" mean?', 'Procrastinate means to delay or postpone action; to put off doing something.'),
(2, 2, 'Which word best completes: "The evidence was _____ and could not be disputed."', 'Irrefutable means impossible to deny or disprove; undeniable.'),
(2, 2, 'What is the meaning of "ubiquitous"?', 'Ubiquitous means present, appearing, or found everywhere; omnipresent.'),
(2, 2, 'Choose the correct word: "Her _____ for music was evident from an early age."', 'Aptitude refers to a natural ability or talent for something.'),
(2, 2, 'What does "meticulous" mean?', 'Meticulous means showing great attention to detail; very careful and precise.');

-- Insert options for Vocabulary - Intermediate questions
INSERT INTO public.question_options (question_id, option_text, is_correct, order_index) VALUES
-- Question 21: procrastinate
(21, 'to work quickly', false, 1),
(21, 'to delay or postpone', true, 2),
(21, 'to finish early', false, 3),
(21, 'to work together', false, 4),

-- Question 22: irrefutable evidence
(22, 'questionable', false, 1),
(22, 'irrefutable', true, 2),
(22, 'confusing', false, 3),
(22, 'interesting', false, 4),

-- Question 23: ubiquitous
(23, 'rare', false, 1),
(23, 'expensive', false, 2),
(23, 'everywhere', true, 3),
(23, 'beautiful', false, 4),

-- Question 24: aptitude for music
(24, 'dislike', false, 1),
(24, 'aptitude', true, 2),
(24, 'fear', false, 3),
(24, 'confusion', false, 4),

-- Question 25: meticulous
(25, 'careless', false, 1),
(25, 'very careful', true, 2),
(25, 'quick', false, 3),
(25, 'lazy', false, 4);

-- Reading Comprehension - Intermediate
INSERT INTO public.questions (category_id, difficulty_id, question_text, explanation) VALUES
(3, 2, 'Read the passage: "Climate change is one of the most pressing issues of our time. Rising temperatures, melting ice caps, and extreme weather events are clear indicators that our planet is warming at an unprecedented rate." What is the main idea?', 'The passage discusses climate change as a major current issue, supported by evidence of global warming.'),
(3, 2, 'Based on the passage: "The invention of the printing press in the 15th century revolutionized the spread of information. Books became more accessible, literacy rates increased, and knowledge could be preserved and shared more easily." What was a result of the printing press?', 'The passage states that books became more accessible as a direct result of the printing press invention.'),
(3, 2, 'Read: "Despite the challenges, renewable energy sources like solar and wind power are becoming increasingly cost-effective. Many countries are investing heavily in these technologies to reduce their carbon footprint." What can be inferred?', 'The passage suggests that countries are choosing renewable energy both for environmental and economic reasons.'),
(3, 2, 'From the text: "The human brain is remarkably adaptable. Neuroplasticity allows our brains to reorganize and form new neural connections throughout our lives, especially in response to learning or injury." What is neuroplasticity?', 'The passage defines neuroplasticity as the brain\'s ability to reorganize and form new neural connections.'),
(3, 2, 'Read: "Social media has transformed how we communicate, but it has also raised concerns about privacy, misinformation, and mental health impacts, particularly among young people." What is the author\'s tone?', 'The author presents both positive and negative aspects, showing a balanced perspective on social media.');

-- Insert options for Reading Comprehension - Intermediate questions
INSERT INTO public.question_options (question_id, option_text, is_correct, order_index) VALUES
-- Question 26: Climate change main idea
(26, 'Climate change is not a real problem', false, 1),
(26, 'Climate change is a major current issue', true, 2),
(26, 'Climate change only affects ice caps', false, 3),
(26, 'Climate change is easy to solve', false, 4),

-- Question 27: Result of printing press
(27, 'Books became more expensive', false, 1),
(27, 'Books became more accessible', true, 2),
(27, 'People stopped reading', false, 3),
(27, 'Libraries were closed', false, 4),

-- Question 28: Renewable energy inference
(28, 'Countries only care about the environment', false, 1),
(28, 'Renewable energy is too expensive', false, 2),
(28, 'Countries invest for environmental and economic reasons', true, 3),
(28, 'Only poor countries use renewable energy', false, 4),

-- Question 29: Neuroplasticity definition
(29, 'The brain cannot change', false, 1),
(29, 'The brain can reorganize and form new connections', true, 2),
(29, 'Only young brains can adapt', false, 3),
(29, 'The brain only changes when injured', false, 4),

-- Question 30: Author's tone about social media
(30, 'Completely positive', false, 1),
(30, 'Completely negative', false, 2),
(30, 'Balanced, showing both sides', true, 3),
(30, 'Neutral and uninterested', false, 4);
