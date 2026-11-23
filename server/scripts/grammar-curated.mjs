/**
 * Hand-authored grammar topics that override LLM generation.
 *
 * The model (gpt-oss-120b) cannot reliably track Korean 받침 (whether a noun
 * ends in a consonant or vowel), which particle selection depends on, and it
 * tends to pre-attach the tested particle to the noun while adding a stray
 * blank. Particle rules are fully deterministic, so these foundational topics
 * are authored by hand for correctness. Keyed by language id, then topic id;
 * the generator splices these in over whatever the model produced.
 */
export const CURATED = {
  korean: {
    'topic-particle': {
      summary: 'The topic particle 은/는 marks what a sentence is about — use 은 after a consonant and 는 after a vowel.',
      explanation:
        '은/는 marks the topic, the thing the sentence is commenting on, often with a sense of contrast. Attach 은 to a noun ending in a consonant and 는 to a noun ending in a vowel. It differs from the subject particle 이/가, which simply marks the grammatical subject.',
      examples: [
        { text: '저는 학생이에요.', romanization: 'jeoneun haksaeng-ieyo.', translation: 'I am a student.' },
        { text: '책은 책상 위에 있어요.', romanization: 'chaegeun chaeksang wie isseoyo.', translation: 'The book is on the desk.' },
        { text: '오늘은 날씨가 좋아요.', romanization: 'oneureun nalssiga joayo.', translation: 'Today the weather is nice.' },
      ],
      exercises: [
        { prompt: '저___ 한국 사람이에요.', promptTranslation: 'I am Korean.', options: ['은', '는', '이', '가'], answerIndex: 1, explanation: '저 ends in a vowel, so the topic particle 는 is used.' },
        { prompt: '동생___ 키가 커요.', promptTranslation: 'My younger sibling is tall.', options: ['은', '는', '이', '가'], answerIndex: 0, explanation: '동생 ends in a consonant, so 은 is used.' },
        { prompt: '커피___ 맛있어요.', promptTranslation: 'The coffee is delicious.', options: ['은', '는', '이', '가'], answerIndex: 1, explanation: '커피 ends in a vowel, so 는 is used.' },
        { prompt: '산___ 높아요.', promptTranslation: 'The mountain is high.', options: ['은', '는', '이', '가'], answerIndex: 0, explanation: '산 ends in a consonant, so 은 is used.' },
      ],
    },
    'subject-particle': {
      summary: 'The subject particle 이/가 marks the grammatical subject — use 이 after a consonant and 가 after a vowel.',
      explanation:
        '이/가 marks the subject that performs the action or is described. Attach 이 to a noun ending in a consonant and 가 to a noun ending in a vowel. Compared with 은/는, 이/가 often introduces new or specific information.',
      examples: [
        { text: '친구가 왔어요.', romanization: 'chinguga wasseoyo.', translation: 'A friend came.' },
        { text: '책이 책상 위에 있어요.', romanization: 'chaegi chaeksang wie isseoyo.', translation: 'The book is on the desk.' },
        { text: '날씨가 좋아요.', romanization: 'nalssiga joayo.', translation: 'The weather is nice.' },
      ],
      exercises: [
        { prompt: '학생___ 도서관에 있어요.', promptTranslation: 'A student is in the library.', options: ['이', '가', '은', '는'], answerIndex: 0, explanation: '학생 ends in a consonant, so 이 is used.' },
        { prompt: '바람___ 불어요.', promptTranslation: 'The wind is blowing.', options: ['이', '가', '은', '는'], answerIndex: 0, explanation: '바람 ends in a consonant, so 이 is used.' },
        { prompt: '아이___ 자고 있어요.', promptTranslation: 'The child is sleeping.', options: ['이', '가', '은', '는'], answerIndex: 1, explanation: '아이 ends in a vowel, so 가 is used.' },
        { prompt: '시간___ 없어요.', promptTranslation: "There is no time.", options: ['이', '가', '은', '는'], answerIndex: 0, explanation: '시간 ends in a consonant, so 이 is used.' },
      ],
    },
    'object-particle': {
      summary: 'The object particle 을/를 marks the direct object — use 을 after a consonant and 를 after a vowel.',
      explanation:
        '을/를 marks the direct object, the thing the action is done to. Attach 을 to a noun ending in a consonant and 를 to a noun ending in a vowel.',
      examples: [
        { text: '사과를 먹어요.', romanization: 'sagwareul meogeoyo.', translation: 'I eat an apple.' },
        { text: '책을 읽어요.', romanization: 'chaegeul ilgeoyo.', translation: 'I read a book.' },
        { text: '물을 마셔요.', romanization: 'mureul masyeoyo.', translation: 'I drink water.' },
      ],
      exercises: [
        { prompt: '영화___ 봐요.', promptTranslation: 'I watch a movie.', options: ['을', '를', '이', '가'], answerIndex: 1, explanation: '영화 ends in a vowel, so 를 is used.' },
        { prompt: '밥___ 먹어요.', promptTranslation: 'I eat (a meal).', options: ['을', '를', '이', '가'], answerIndex: 0, explanation: '밥 ends in a consonant, so 을 is used.' },
        { prompt: '커피___ 마셔요.', promptTranslation: 'I drink coffee.', options: ['을', '를', '이', '가'], answerIndex: 1, explanation: '커피 ends in a vowel, so 를 is used.' },
        { prompt: '음식___ 만들어요.', promptTranslation: 'I make food.', options: ['을', '를', '이', '가'], answerIndex: 0, explanation: '음식 ends in a consonant, so 을 is used.' },
      ],
    },
    'present-tense': {
      summary: 'Polite present tense adds -아요 to ㅏ/ㅗ stems, -어요 to other stems, and -해요 to 하다 verbs.',
      explanation:
        'To make the polite present tense, attach -아요 to verb stems whose last vowel is ㅏ or ㅗ, and -어요 to other stems. Verbs ending in 하다 become 해요. For example 가다 → 가요, 먹다 → 먹어요, 공부하다 → 공부해요.',
      examples: [
        { text: '저는 매일 운동해요.', romanization: 'jeoneun maeil undonghaeyo.', translation: 'I exercise every day.' },
        { text: '친구가 책을 읽어요.', romanization: 'chinguga chaegeul ilgeoyo.', translation: 'My friend reads a book.' },
        { text: '우리는 물을 마셔요.', romanization: 'urineun mureul masyeoyo.', translation: 'We drink water.' },
      ],
      exercises: [
        { prompt: '저는 학교에 ___ . (가다)', promptTranslation: 'I go to school.', options: ['가요', '가아요', '거요', '갸요'], answerIndex: 0, explanation: '가다 has the vowel ㅏ, so it becomes 가요.' },
        { prompt: '동생이 밥을 ___ . (먹다)', promptTranslation: 'My sibling eats.', options: ['먹어요', '먹아요', '머거요', '먹요'], answerIndex: 0, explanation: '먹다 has no ㅏ/ㅗ, so it takes -어요 → 먹어요.' },
        { prompt: '우리는 한국어를 ___ . (공부하다)', promptTranslation: 'We study Korean.', options: ['공부해요', '공부하요', '공부어요', '공부아요'], answerIndex: 0, explanation: '하다 verbs become 해요, so 공부하다 → 공부해요.' },
        { prompt: '그 사람은 커피를 ___ . (마시다)', promptTranslation: 'That person drinks coffee.', options: ['마셔요', '마시어요', '마시아요', '마시요'], answerIndex: 0, explanation: '마시다 + -어요 contracts to 마셔요.' },
      ],
    },
    'negation': {
      summary: 'Negate a verb with 안 before it, or by attaching -지 않다 to the stem.',
      explanation:
        'There are two ways to negate. Put 안 directly before the verb (안 가요 = "don’t go"), or attach -지 않다 to the verb stem (가지 않아요). Both mean the same thing; 안 is more colloquial.',
      examples: [
        { text: '저는 안 가요.', romanization: 'jeoneun an gayo.', translation: "I don't go." },
        { text: '그녀는 밥을 안 먹어요.', romanization: 'geunyeoneun babeul an meogeoyo.', translation: "She doesn't eat." },
        { text: '친구가 오지 않아요.', romanization: 'chinguga oji anayo.', translation: "My friend doesn't come." },
      ],
      exercises: [
        { prompt: '저는 오늘 ___ 가요.', promptTranslation: "I don't go today.", options: ['안', '못', '잘', '또'], answerIndex: 0, explanation: '안 before the verb makes it negative: 안 가요.' },
        { prompt: '그녀는 고기를 ___ 먹어요.', promptTranslation: "She doesn't eat meat.", options: ['안', '를', '는', '도'], answerIndex: 0, explanation: '안 먹어요 means "doesn’t eat."' },
        { prompt: '친구가 학교에 가지 ___ .', promptTranslation: "My friend doesn't go to school.", options: ['않아요', '못해요', '있어요', '말아요'], answerIndex: 0, explanation: 'The -지 않다 pattern: 가지 않아요.' },
        { prompt: '비가 오지 ___ .', promptTranslation: "It doesn't rain.", options: ['않아요', '없어요', '아니요', '말아요'], answerIndex: 0, explanation: '오지 않아요 means "it doesn’t rain."' },
      ],
    },
    'location-particles': {
      summary: 'Use 에 for a destination or static location, and 에서 for the place where an action happens.',
      explanation:
        '에 marks a destination (가다/오다) or where something exists (있다/없다). 에서 marks the place where an action takes place. So you go 학교에 (to school) but study 학교에서 (at school).',
      examples: [
        { text: '학교에 가요.', romanization: 'hakgyo-e gayo.', translation: 'I go to school.' },
        { text: '도서관에서 공부해요.', romanization: 'doseogwan-eseo gongbuhaeyo.', translation: 'I study at the library.' },
        { text: '집에 있어요.', romanization: 'jibe isseoyo.', translation: 'I am at home.' },
      ],
      exercises: [
        { prompt: '도서관___ 책을 읽어요.', promptTranslation: 'I read a book at the library.', options: ['에', '에서', '은', '는'], answerIndex: 1, explanation: 'Reading is an action, so the place takes 에서.' },
        { prompt: '학교___ 가요.', promptTranslation: 'I go to school.', options: ['에', '에서', '을', '를'], answerIndex: 0, explanation: '가다 takes a destination, so 학교 takes 에.' },
        { prompt: '공원___ 운동해요.', promptTranslation: 'I exercise at the park.', options: ['에', '에서', '은', '는'], answerIndex: 1, explanation: 'Exercising is an action done at the park, so 에서.' },
        { prompt: '집___ 있어요.', promptTranslation: 'I am at home.', options: ['에', '에서', '을', '를'], answerIndex: 0, explanation: '있다 marks a static location with 에.' },
      ],
    },
    'can-could': {
      summary: '-(으)ㄹ 수 있다/없다 says someone can or cannot do something — -을 수 after a consonant, -ㄹ 수 after a vowel.',
      explanation:
        'Attach -을 수 있다 to a verb stem ending in a consonant and -ㄹ 수 있다 to a stem ending in a vowel; swap 있다 for 없다 to say "cannot". Stems ending in ㄹ just add 수 (만들다 → 만들 수 있어요). It expresses both ability and possibility.',
      examples: [
        { text: '저는 한국어를 할 수 있어요.', romanization: 'jeoneun hangugeoreul hal su isseoyo.', translation: 'I can speak Korean.' },
        { text: '여기에서 사진을 찍을 수 없어요.', romanization: 'yeogieseo sajineul jjigeul su eopseoyo.', translation: "You can't take photos here." },
        { text: '내일 만날 수 있어요?', romanization: 'naeil mannal su isseoyo?', translation: 'Can we meet tomorrow?' },
      ],
      exercises: [
        { prompt: '김치를 ___ 수 있어요.', promptTranslation: 'I can eat kimchi.', options: ['먹는', '먹을', '먹', '먹어'], answerIndex: 1, explanation: '먹 ends in a consonant, so -을 수 있다 gives 먹을 수 있어요.' },
        { prompt: '수영을 ___ 수 없어요.', promptTranslation: "I can't swim.", options: ['하는', '했', '할', '하을'], answerIndex: 2, explanation: '하 ends in a vowel, so -ㄹ is attached: 할 수 없어요.' },
        { prompt: '케이크를 ___ 수 있어요.', promptTranslation: 'I can make a cake.', options: ['만들', '만들을', '만드는', '만들어'], answerIndex: 0, explanation: '만들다 ends in ㄹ, so only 수 is added: 만들 수 있어요.' },
        { prompt: '오늘은 바빠서 ___ 수 없어요.', promptTranslation: "I'm busy today, so I can't go.", options: ['가는', '가을', '갔', '갈'], answerIndex: 3, explanation: '가 ends in a vowel, so -ㄹ is attached: 갈 수 없어요.' },
      ],
    },
    'must': {
      summary: '-아/어야 하다 means "have to / must" and follows the same vowel harmony as -아요/어요.',
      explanation:
        'Take the -아요/어요 form of a verb, drop 요, and add 야 하다 (or 야 되다 in speech): 가요 → 가야 해요, 먹어요 → 먹어야 해요, 공부해요 → 공부해야 해요. Tense goes on 하다, so 가야 했어요 means "had to go".',
      examples: [
        { text: '내일 일찍 일어나야 해요.', romanization: 'naeil iljjik ireonaya haeyo.', translation: 'I have to get up early tomorrow.' },
        { text: '숙제를 해야 돼요.', romanization: 'sukjereul haeya dwaeyo.', translation: 'I have to do my homework.' },
        { text: '어제 병원에 가야 했어요.', romanization: 'eoje byeongwone gaya haesseoyo.', translation: 'I had to go to the hospital yesterday.' },
      ],
      exercises: [
        { prompt: '약을 ___ 해요.', promptTranslation: 'I have to take medicine.', options: ['먹어야', '먹아야', '먹으야', '먹고'], answerIndex: 0, explanation: '먹 has the vowel ㅓ, so -어야: 먹어야 해요.' },
        { prompt: '지금 집에 ___ 해요.', promptTranslation: 'I have to go home now.', options: ['가아야', '가야', '가어야', '가고'], answerIndex: 1, explanation: '가 + 아야 contracts to 가야.' },
        { prompt: '시험이 있어서 ___ 해요.', promptTranslation: 'I have an exam, so I have to study.', options: ['공부하야', '공부하어야', '공부해야', '공부하고'], answerIndex: 2, explanation: '하다 verbs become 해야: 공부해야 해요.' },
        { prompt: '이 책을 ___ 해요.', promptTranslation: 'I have to read this book.', options: ['읽아야', '읽으야', '읽고', '읽어야'], answerIndex: 3, explanation: '읽 has the vowel ㅣ (not ㅏ/ㅗ), so -어야: 읽어야 해요.' },
      ],
    },
    'because': {
      summary: '-아서/어서 gives a reason or cause ("because / so") using the same vowel harmony as -아요/어요.',
      explanation:
        'Drop 요 from the -아요/어요 form and add 서: 바빠요 → 바빠서, 먹어요 → 먹어서, 피곤해요 → 피곤해서. Never put past tense before it (not 갔어서) — tense goes on the final verb only. It also cannot be followed by a command or suggestion; use -(으)니까 for those.',
      examples: [
        { text: '배가 고파서 밥을 먹었어요.', romanization: 'baega gopaseo babeul meogeosseoyo.', translation: 'I was hungry, so I ate.' },
        { text: '피곤해서 일찍 잤어요.', romanization: 'pigonhaeseo iljjik jasseoyo.', translation: 'I was tired, so I went to bed early.' },
        { text: '비가 와서 집에 있었어요.', romanization: 'biga waseo jibe isseosseoyo.', translation: 'It rained, so I stayed home.' },
      ],
      exercises: [
        { prompt: '날씨가 ___ 산책했어요.', promptTranslation: 'The weather was nice, so I took a walk.', options: ['좋아서', '좋어서', '좋았어서', '좋하서'], answerIndex: 0, explanation: '좋 has the vowel ㅗ, so -아서: 좋아서. Past tense never goes before -아서.' },
        { prompt: '머리가 ___ 약을 먹었어요.', promptTranslation: 'I had a headache, so I took medicine.', options: ['아프어서', '아파서', '아팠어서', '아프아서'], answerIndex: 1, explanation: '아프다 drops ㅡ and becomes 아파서.' },
        { prompt: '시간이 ___ 못 갔어요.', promptTranslation: "I didn't have time, so I couldn't go.", options: ['없아서', '없었어서', '없어서', '없서'], answerIndex: 2, explanation: '없 has the vowel ㅓ, so -어서: 없어서.' },
        { prompt: '일이 ___ 늦었어요.', promptTranslation: 'I had a lot of work, so I was late.', options: ['많어서', '많았어서', '많서', '많아서'], answerIndex: 3, explanation: '많 has the vowel ㅏ, so -아서: 많아서.' },
      ],
    },
    'if-myeon': {
      summary: '-(으)면 means "if / when" — -으면 after a consonant, -면 after a vowel or ㄹ.',
      explanation:
        'Attach -으면 to a stem ending in a consonant and -면 to a stem ending in a vowel or ㄹ: 먹다 → 먹으면, 가다 → 가면, 살다 → 살면. The -(으)면 clause states the condition and the second clause states the result.',
      examples: [
        { text: '시간이 있으면 같이 가요.', romanization: 'sigani isseumyeon gachi gayo.', translation: "If you have time, let's go together." },
        { text: '비가 오면 우산을 쓰세요.', romanization: 'biga omyeon usaneul sseuseyo.', translation: 'If it rains, use an umbrella.' },
        { text: '한국에 살면 한국어를 빨리 배울 거예요.', romanization: 'hanguge salmyeon hangugeoreul ppalli baeul geoyeyo.', translation: "If you live in Korea, you'll learn Korean quickly." },
      ],
      exercises: [
        { prompt: '이 약을 ___ 괜찮아질 거예요.', promptTranslation: "If you take this medicine, you'll feel better.", options: ['먹면', '먹으면', '먹어면', '먹는면'], answerIndex: 1, explanation: '먹 ends in a consonant, so -으면: 먹으면.' },
        { prompt: '___ 쉬세요.', promptTranslation: "If you're tired, get some rest.", options: ['피곤하면', '피곤하으면', '피곤해면', '피곤한면'], answerIndex: 0, explanation: '하 ends in a vowel, so -면: 피곤하면.' },
        { prompt: '서울에 ___ 연락하세요.', promptTranslation: 'If you come to Seoul, get in touch.', options: ['오으면', '와면', '오면', '온면'], answerIndex: 2, explanation: '오 ends in a vowel, so -면: 오면.' },
        { prompt: '창문을 ___ 시원해요.', promptTranslation: "If you open the window, it's cool.", options: ['열으면', '열어면', '여면', '열면'], answerIndex: 3, explanation: '열다 ends in ㄹ, so only -면 is added: 열면.' },
      ],
    },
    'indirect-speech': {
      summary: 'Report what someone said with -다고 하다: -ㄴ/는다고 for action verbs, -다고 for adjectives, and -(이)라고 for nouns.',
      explanation:
        'Present-tense action verbs take -는다고 after a consonant stem and -ㄴ다고 after a vowel stem (먹는다고, 간다고). Adjectives and 있다/없다 take -다고 (바쁘다고, 있다고), the past uses -았/었다고 (갔다고), and nouns take -(이)라고 (학생이라고, 의사라고). In speech -다고 해요 often shortens to -대요.',
      examples: [
        { text: '친구가 내일 온다고 했어요.', romanization: 'chinguga naeil ondago haesseoyo.', translation: 'My friend said they are coming tomorrow.' },
        { text: '민수 씨가 바쁘다고 해요.', romanization: 'minsu ssiga bappeudago haeyo.', translation: 'Minsu says they are busy.' },
        { text: '그 사람이 학생이라고 했어요.', romanization: 'geu sarami haksaengirago haesseoyo.', translation: 'That person said they are a student.' },
      ],
      exercises: [
        { prompt: '동생이 지금 밥을 ___ 했어요.', promptTranslation: 'My younger sibling said they are eating now.', options: ['먹는다고', '먹다고', '먹이라고', '먹자고'], answerIndex: 0, explanation: '먹다 is an action verb with a consonant stem, so -는다고: 먹는다고.' },
        { prompt: '친구가 밖이 ___ 했어요.', promptTranslation: 'My friend said it is cold outside.', options: ['춥는다고', '춥다고', '춥라고', '추운다고'], answerIndex: 1, explanation: '춥다 is an adjective, so it takes -다고 directly: 춥다고.' },
        { prompt: '그 사람이 의사___ 했어요.', promptTranslation: 'That person said they are a doctor.', options: ['이라고', '다고', '라고', '는다고'], answerIndex: 2, explanation: '의사 is a noun ending in a vowel, so -라고: 의사라고.' },
        { prompt: '엄마가 어제 시장에 ___ 했어요.', promptTranslation: 'Mom said she went to the market yesterday.', options: ['간다고', '가다고', '갔라고', '갔다고'], answerIndex: 3, explanation: 'A past event is reported with -았/었다고: 갔다고.' },
      ],
    },
    'deorago': {
      summary: '-더라고요 shares something you saw, heard or felt first-hand in the past — like "I noticed that…".',
      explanation:
        'Attach -더라고요 directly to a verb or adjective stem (맛있더라고요, 많더라고요) and -(이)더라고요 to nouns. It reports something you discovered through your own experience, so the subject is usually someone or something other than yourself. It sounds conversational and invites the listener into your experience.',
      examples: [
        { text: '그 식당 음식이 정말 맛있더라고요.', romanization: 'geu sikdang eumsigi jeongmal masitdeoragoyo.', translation: 'The food at that restaurant was really good (I found).' },
        { text: '서울은 사람이 많더라고요.', romanization: 'seoureun sarami manteoragoyo.', translation: 'Seoul had so many people (I noticed).' },
        { text: '민지 씨가 노래를 잘하더라고요.', romanization: 'minji ssiga noraereul jalhadeoragoyo.', translation: 'Minji sings well (I heard it myself).' },
      ],
      exercises: [
        { prompt: '그 영화가 정말 ___.', promptTranslation: 'That movie was really fun (I found).', options: ['재미있더라고요', '재미있을까요', '재미있고 싶어요', '재미있으세요'], answerIndex: 0, explanation: '-더라고요 shares a first-hand experience: 재미있더라고요.' },
        { prompt: '제주도는 바람이 많이 ___.', promptTranslation: 'It was really windy on Jeju (I noticed).', options: ['불까요', '불더라고요', '불고 싶어요', '불으세요'], answerIndex: 1, explanation: '불다 + -더라고요 → 불더라고요, reporting what you experienced.' },
        { prompt: '한국 사람들은 매운 음식을 잘 ___.', promptTranslation: 'Korean people eat spicy food well (I noticed).', options: ['먹을까요', '먹고 싶어요', '먹더라고요', '먹으세요'], answerIndex: 2, explanation: 'You are sharing an observation, so 먹더라고요.' },
        { prompt: '그 가게는 일요일에 문을 ___.', promptTranslation: 'That shop was closed on Sunday (I saw).', options: ['닫고 싶어요', '닫을까요', '닫으세요', '닫더라고요'], answerIndex: 3, explanation: '닫다 + -더라고요 → 닫더라고요, something you saw yourself.' },
      ],
    },
    'l-tende': {
      summary: '-(으)ㄹ 텐데 expresses an expectation that sets up what you say next — "it must/would be…, so…".',
      explanation:
        'Attach -을 텐데 after a consonant stem and -ㄹ 텐데 after a vowel stem (먹을 텐데, 바쁠 텐데); nouns take 일 텐데. The speaker assumes something is likely and uses it as background for advice, worry or a wish. Ending a sentence with -(으)ㄹ 텐데요 leaves a hopeful or worried tone.',
      examples: [
        { text: '내일 바쁠 텐데 일찍 주무세요.', romanization: 'naeil bappeul tende iljjik jumuseyo.', translation: "You'll probably be busy tomorrow, so get to bed early." },
        { text: '배고플 텐데 이거 드세요.', romanization: 'baegopeul tende igeo deuseyo.', translation: 'You must be hungry — have this.' },
        { text: '시간이 있으면 좋을 텐데요.', romanization: 'sigani isseumyeon joeul tendeyo.', translation: 'It would be nice if I had time.' },
      ],
      exercises: [
        { prompt: '그 사람은 지금 ___ 텐데 나중에 전화하세요.', promptTranslation: "They're probably working now, so call later.", options: ['일할', '일하을', '일한', '일하는'], answerIndex: 0, explanation: '하 ends in a vowel, so -ㄹ 텐데: 일할 텐데.' },
        { prompt: '밖이 ___ 텐데 코트를 입으세요.', promptTranslation: "It's probably cold outside, so wear a coat.", options: ['춥을', '추울', '춥는', '추운'], answerIndex: 1, explanation: '춥다 is ㅂ-irregular: 춥 + 을 → 추울 텐데.' },
        { prompt: '많이 ___ 텐데 좀 쉬세요.', promptTranslation: 'You must be very tired, so rest a little.', options: ['피곤한', '피곤하을', '피곤할', '피곤해'], answerIndex: 2, explanation: '하 ends in a vowel, so -ㄹ 텐데: 피곤할 텐데.' },
        { prompt: '음식이 ___ 텐데 천천히 드세요.', promptTranslation: 'The food is probably hot, so eat slowly.', options: ['뜨겁을', '뜨거운', '뜨겁는', '뜨거울'], answerIndex: 3, explanation: '뜨겁다 is ㅂ-irregular: 뜨겁 + 을 → 뜨거울 텐데.' },
      ],
    },
    'passive': {
      summary: 'Passive verbs add -이-, -히-, -리- or -기- to certain stems, turning "do" into "be done".',
      explanation:
        'Which suffix a verb takes has to be learned: 보다 → 보이다 (be seen), 닫다 → 닫히다 (be closed), 듣다 → 들리다 (be heard), 열다 → 열리다 (be opened), 안다 → 안기다 (be held). The thing affected becomes the subject with 이/가, and the doer, if mentioned, takes 에게 or 한테. Most 하다 verbs use 되다 instead (사용하다 → 사용되다).',
      examples: [
        { text: '문이 열렸어요.', romanization: 'muni yeollyeosseoyo.', translation: 'The door opened.' },
        { text: '여기서 산이 잘 보여요.', romanization: 'yeogiseo sani jal boyeoyo.', translation: 'You can see the mountain well from here.' },
        { text: '아이가 엄마에게 안겼어요.', romanization: 'aiga eommaege angyeosseoyo.', translation: 'The child was held by its mother.' },
      ],
      exercises: [
        { prompt: '칠판 글씨가 잘 ___.', promptTranslation: 'The writing on the board is easy to see.', options: ['보여요', '봐요', '보혀요', '보겨요'], answerIndex: 0, explanation: '보다 takes -이- in the passive: 보이다 → 보여요.' },
        { prompt: '바람 때문에 창문이 ___.', promptTranslation: 'The window closed because of the wind.', options: ['닫았어요', '닫혔어요', '닫겼어요', '닫렸어요'], answerIndex: 1, explanation: '닫다 takes -히- in the passive: 닫히다 → 닫혔어요.' },
        { prompt: '전화 소리가 잘 안 ___.', promptTranslation: "I can't hear the phone well.", options: ['들어요', '듣혀요', '들려요', '듣기어요'], answerIndex: 2, explanation: '듣다 takes -리- in the passive: 들리다 → 들려요.' },
        { prompt: '아기가 엄마 품에 ___.', promptTranslation: "The baby was held in its mother's arms.", options: ['안았어요', '안혔어요', '안렸어요', '안겼어요'], answerIndex: 3, explanation: '안다 takes -기- in the passive: 안기다 → 안겼어요.' },
      ],
    },
  },
  japanese: {
    'topic-particle-wa': {
      summary: 'は marks the topic of a sentence — written は but pronounced "wa".',
      explanation:
        'は marks the topic, what the sentence is about. It is written with the hiragana は but pronounced "wa". The basic pattern is "A は B です" (As for A, it is B).',
      examples: [
        { text: '私は学生です。', romanization: 'watashi wa gakusei desu.', translation: 'I am a student.' },
        { text: 'これはペンです。', romanization: 'kore wa pen desu.', translation: 'This is a pen.' },
        { text: '今日は暑いです。', romanization: 'kyō wa atsui desu.', translation: 'Today is hot.' },
      ],
      exercises: [
        { prompt: '彼___先生です。', promptTranslation: 'He is a teacher.', options: ['は', 'が', 'を', 'に'], answerIndex: 0, explanation: 'は marks 彼 as the topic: "As for him, he is a teacher."' },
        { prompt: 'この料理___おいしいです。', promptTranslation: 'This dish is delicious.', options: ['は', 'を', 'に', 'で'], answerIndex: 0, explanation: 'は marks この料理 as the topic.' },
        { prompt: '私の名前___田中です。', promptTranslation: 'My name is Tanaka.', options: ['は', 'が', 'を', 'の'], answerIndex: 0, explanation: 'は marks 名前 as the topic.' },
        { prompt: '日本___四季があります。', promptTranslation: 'Japan has four seasons.', options: ['は', 'を', 'に', 'で'], answerIndex: 0, explanation: 'は sets 日本 as the topic: "In Japan, there are four seasons."' },
      ],
    },
    'subject-particle-ga': {
      summary: 'が marks the grammatical subject, often introducing new or identifying information.',
      explanation:
        'が marks the subject that performs an action or is newly introduced. Use it (rather than は) to answer "who/what" or to point out specific information. Verbs of existence, perception, and ability also take が.',
      examples: [
        { text: '犬が走っています。', romanization: 'inu ga hashitte imasu.', translation: 'A dog is running.' },
        { text: '雨が降っています。', romanization: 'ame ga futte imasu.', translation: 'It is raining.' },
        { text: '私は日本語がわかります。', romanization: 'watashi wa nihongo ga wakarimasu.', translation: 'I understand Japanese.' },
      ],
      exercises: [
        { prompt: '学生___図書館にいます。', promptTranslation: 'A student is in the library.', options: ['が', 'は', 'を', 'に'], answerIndex: 0, explanation: 'が marks 学生 as the subject that exists there.' },
        { prompt: '桜___きれいです。', promptTranslation: 'The cherry blossoms are pretty.', options: ['が', 'を', 'に', 'で'], answerIndex: 0, explanation: 'が marks 桜 as the subject being described.' },
        { prompt: 'だれ___来ましたか。', promptTranslation: 'Who came?', options: ['が', 'は', 'を', 'の'], answerIndex: 0, explanation: 'Question words like だれ take が, not は.' },
        { prompt: '音___聞こえます。', promptTranslation: 'A sound can be heard.', options: ['が', 'を', 'に', 'で'], answerIndex: 0, explanation: 'Perception verbs like 聞こえる take が.' },
      ],
    },
    'object-particle-wo': {
      summary: 'を marks the direct object of a verb, pronounced "o".',
      explanation:
        'を marks the direct object, the thing an action is done to. It is written を but pronounced "o". The pattern is "[object] を [verb]".',
      examples: [
        { text: '手紙を書きます。', romanization: 'tegami o kakimasu.', translation: 'I write a letter.' },
        { text: '音楽を聞きます。', romanization: 'ongaku o kikimasu.', translation: 'I listen to music.' },
        { text: 'お茶を飲みます。', romanization: 'ocha o nomimasu.', translation: 'I drink tea.' },
      ],
      exercises: [
        { prompt: '彼は手紙___書きました。', promptTranslation: 'He wrote a letter.', options: ['を', 'は', 'が', 'に'], answerIndex: 0, explanation: 'を marks 手紙 as the object of 書く.' },
        { prompt: '私は音楽___聞きます。', promptTranslation: 'I listen to music.', options: ['を', 'が', 'に', 'で'], answerIndex: 0, explanation: 'を marks 音楽 as the object of 聞く.' },
        { prompt: '子供がお菓子___食べた。', promptTranslation: 'The child ate sweets.', options: ['を', 'は', 'が', 'の'], answerIndex: 0, explanation: 'を marks お菓子 as the object of 食べる.' },
        { prompt: '毎朝コーヒー___飲みます。', promptTranslation: 'I drink coffee every morning.', options: ['を', 'に', 'で', 'は'], answerIndex: 0, explanation: 'を marks コーヒー as the object of 飲む.' },
      ],
    },
    'particles-ni-de': {
      summary: 'Use に for destinations, time points, and existence; use で for where an action happens.',
      explanation:
        'に marks a destination (東京に行く), a point in time (9時に), or where something exists (机の上に). で marks the place where an action occurs (カフェで食べる) and the means used. Relative time words like 明日 take no particle.',
      examples: [
        { text: '学校に行きます。', romanization: 'gakkō ni ikimasu.', translation: 'I go to school.' },
        { text: 'カフェで昼ごはんを食べます。', romanization: 'kafe de hirugohan o tabemasu.', translation: 'I eat lunch at a cafe.' },
        { text: '9時に始まります。', romanization: 'kuji ni hajimarimasu.', translation: 'It starts at 9 o’clock.' },
      ],
      exercises: [
        { prompt: '駅___待っています。', promptTranslation: 'I am waiting at the station.', options: ['で', 'に', 'を', 'は'], answerIndex: 0, explanation: 'Waiting is an action at the station, so で.' },
        { prompt: '東京___行きます。', promptTranslation: 'I go to Tokyo.', options: ['に', 'で', 'を', 'は'], answerIndex: 0, explanation: 'に marks 東京 as the destination of 行く.' },
        { prompt: '図書館___本を読みます。', promptTranslation: 'I read a book at the library.', options: ['で', 'に', 'を', 'へ'], answerIndex: 0, explanation: 'Reading happens at the library, so で.' },
        { prompt: '7時___起きます。', promptTranslation: 'I get up at 7 o’clock.', options: ['に', 'で', 'を', 'は'], answerIndex: 0, explanation: 'に marks the clock time 7時.' },
      ],
    },
    'possessive-no': {
      summary: 'の links two nouns, showing possession or relationship (A の B = B of A).',
      explanation:
        'の connects nouns: the first noun modifies the second. It shows possession (私の本 = my book), origin, or type (日本語の先生 = Japanese teacher). The pattern is A の B.',
      examples: [
        { text: 'これは私の本です。', romanization: 'kore wa watashi no hon desu.', translation: 'This is my book.' },
        { text: '田中さんの車です。', romanization: 'Tanaka-san no kuruma desu.', translation: 'It is Mr. Tanaka’s car.' },
        { text: '東京の天気はいいです。', romanization: 'Tōkyō no tenki wa ii desu.', translation: 'Tokyo’s weather is good.' },
      ],
      exercises: [
        { prompt: 'これは私___ペンです。', promptTranslation: 'This is my pen.', options: ['の', 'は', 'が', 'を'], answerIndex: 0, explanation: 'の links 私 and ペン: "my pen."' },
        { prompt: '田中さん___車は新しいです。', promptTranslation: "Mr. Tanaka's car is new.", options: ['の', 'を', 'に', 'で'], answerIndex: 0, explanation: 'の shows possession: "Mr. Tanaka’s car."' },
        { prompt: '日本語___先生です。', promptTranslation: 'He is a Japanese teacher.', options: ['の', 'は', 'が', 'を'], answerIndex: 0, explanation: 'の links 日本語 and 先生: "Japanese teacher."' },
        { prompt: '彼___名前は田中です。', promptTranslation: 'His name is Tanaka.', options: ['の', 'が', 'を', 'は'], answerIndex: 0, explanation: 'の shows "his name."' },
      ],
    },
    'plain-form': {
      summary: 'The plain form is the casual version of a verb — dictionary form, ない (not), た (did) and なかった (did not).',
      explanation:
        'Casual speech swaps the -ます forms for plain forms: 食べます → 食べる, 食べません → 食べない, 食べました → 食べた, 食べませんでした → 食べなかった. です becomes だ (often dropped), and い-adjectives simply drop です. Plain forms are also required before many patterns, such as と思う.',
      examples: [
        { text: '明日、映画を見る？', romanization: 'ashita, eiga o miru?', translation: 'Are you going to see a movie tomorrow?' },
        { text: '昨日は何も食べなかった。', romanization: 'kinō wa nani mo tabenakatta.', translation: "I didn't eat anything yesterday." },
        { text: '今日は忙しい。', romanization: 'kyō wa isogashii.', translation: "I'm busy today." },
      ],
      exercises: [
        { prompt: '今日は学校に___。', promptTranslation: "I'm not going to school today.", options: ['行かない', '行く', '行った', '行きます'], answerIndex: 0, explanation: 'The plain negative of 行く is 行かない.' },
        { prompt: '昨日、友達と映画を___。', promptTranslation: 'I saw a movie with a friend yesterday.', options: ['見る', '見た', '見ない', '見ます'], answerIndex: 1, explanation: 'A past action in casual speech uses the た form: 見た.' },
        { prompt: 'ご飯、もう___？', promptTranslation: 'Have you eaten already?', options: ['食べる', '食べない', '食べた', '食べます'], answerIndex: 2, explanation: 'もう with a completed action takes the た form: 食べた.' },
        { prompt: '先週は雨が___。', promptTranslation: "It didn't rain last week.", options: ['降る', '降った', '降らない', '降らなかった'], answerIndex: 3, explanation: 'Past negative in plain form is なかった: 降らなかった.' },
      ],
    },
    'potential-form': {
      summary: 'The potential form says "can do": godan verbs change -u to -eru, and ichidan verbs swap る for られる.',
      explanation:
        'For godan verbs, change the final -u sound to -e and add る: 書く → 書ける, 話す → 話せる, 飲む → 飲める. For ichidan verbs, replace る with られる: 食べる → 食べられる, 見る → 見られる. The irregulars are する → できる and 来る → 来られる. The thing you can do is often marked with が instead of を.',
      examples: [
        { text: '日本語が話せます。', romanization: 'nihongo ga hanasemasu.', translation: 'I can speak Japanese.' },
        { text: '納豆が食べられません。', romanization: 'nattō ga taberaremasen.', translation: "I can't eat natto." },
        { text: '明日来られますか。', romanization: 'ashita koraremasu ka.', translation: 'Can you come tomorrow?' },
      ],
      exercises: [
        { prompt: '一人で___か。', promptTranslation: 'Can you go by yourself?', options: ['行けます', '行きます', '行かせます', '行きたいです'], answerIndex: 0, explanation: '行く is godan: -u → -eru gives 行ける → 行けます.' },
        { prompt: '漢字が___。', promptTranslation: 'I can write kanji.', options: ['書きます', '書けます', '書かせます', '書きたいです'], answerIndex: 1, explanation: '書く is godan: 書ける → 書けます.' },
        { prompt: '刺身が___。', promptTranslation: 'I can eat sashimi.', options: ['食べます', '食べさせます', '食べられます', '食べけます'], answerIndex: 2, explanation: '食べる is ichidan: replace る with られる → 食べられます.' },
        { prompt: 'ピアノが___。', promptTranslation: 'I can play the piano.', options: ['弾きます', '弾かせます', '弾きたいです', '弾けます'], answerIndex: 3, explanation: '弾く is godan: 弾ける → 弾けます.' },
      ],
    },
    'must-nakereba': {
      summary: '-なければならない means "must / have to" — take the ない form, drop ない, and add なければならない.',
      explanation:
        'Replace the ない of the negative form with なければならない (or なければいけない): 行かない → 行かなければならない, 食べない → 食べなければならない, しない → しなければならない. In polite speech say なければなりません/いけません; in casual speech it shortens to なきゃ or なくちゃ.',
      examples: [
        { text: '明日は早く起きなければなりません。', romanization: 'ashita wa hayaku okinakereba narimasen.', translation: 'I have to get up early tomorrow.' },
        { text: '宿題をしなければいけない。', romanization: 'shukudai o shinakereba ikenai.', translation: 'I have to do my homework.' },
        { text: 'もう帰らなきゃ。', romanization: 'mō kaeranakya.', translation: 'I have to go home now.' },
      ],
      exercises: [
        { prompt: '薬を___なりません。', promptTranslation: 'I have to take medicine.', options: ['飲まなければ', '飲めなければ', '飲みなければ', '飲むなければ'], answerIndex: 0, explanation: '飲む → 飲まない → 飲まなければ.' },
        { prompt: '毎日日本語を___いけません。', promptTranslation: 'I must study Japanese every day.', options: ['勉強するなければ', '勉強しなければ', '勉強さなければ', '勉強しないければ'], answerIndex: 1, explanation: 'する → しない → しなければ.' },
        { prompt: '八時までに会社に___なりません。', promptTranslation: 'I have to get to the office by eight.', options: ['行きなければ', '行けなければ', '行かなければ', '行くなければ'], answerIndex: 2, explanation: '行く → 行かない → 行かなければ.' },
        { prompt: 'このレポートを今日中に___なりません。', promptTranslation: 'I have to write this report today.', options: ['書きなければ', '書くなければ', '書けなければ', '書かなければ'], answerIndex: 3, explanation: '書く → 書かない → 書かなければ.' },
      ],
    },
    'conditional-tara': {
      summary: '-たら means "if" or "when / once" — add ら to the plain past た form.',
      explanation:
        'Make the plain past form and add ら: 行った → 行ったら, 食べた → 食べたら, 安かった → 安かったら, 雨だった → 雨だったら. It marks a condition, or something that happens first before the main clause. The main clause can be a request, a plan or a past discovery.',
      examples: [
        { text: '雨が降ったら、家にいます。', romanization: 'ame ga futtara, ie ni imasu.', translation: "If it rains, I'll stay home." },
        { text: '駅に着いたら、電話してください。', romanization: 'eki ni tsuitara, denwa shite kudasai.', translation: 'Please call me when you get to the station.' },
        { text: '安かったら、買います。', romanization: 'yasukattara, kaimasu.', translation: "If it's cheap, I'll buy it." },
      ],
      exercises: [
        { prompt: '時間が___、遊びに来てください。', promptTranslation: 'If you have time, please come over.', options: ['あったら', 'あるたら', 'ありたら', 'あたら'], answerIndex: 0, explanation: 'ある → あった → あったら.' },
        { prompt: '___、窓を開けてください。', promptTranslation: "If it's hot, please open the window.", options: ['暑いたら', '暑かったら', '暑くたら', '暑だったら'], answerIndex: 1, explanation: 'い-adjectives use the past かった + ら: 暑かったら.' },
        { prompt: '家に___、すぐ寝ます。', promptTranslation: "Once I get home, I'll go straight to bed.", options: ['帰るたら', '帰りたら', '帰ったら', '帰たら'], answerIndex: 2, explanation: '帰る is godan: 帰った → 帰ったら.' },
        { prompt: '宿題が___、テレビを見てもいいです。', promptTranslation: 'Once your homework is done, you can watch TV.', options: ['終わるたら', '終わりたら', '終わたら', '終わったら'], answerIndex: 3, explanation: '終わる → 終わった → 終わったら.' },
      ],
    },
    'passive': {
      summary: 'The passive form -れる/-られる shows something is done to the subject, with the doer marked by に.',
      explanation:
        'For godan verbs change -u to -a and add れる: 読む → 読まれる, 言う → 言われる, 盗む → 盗まれる. For ichidan verbs replace る with られる: 食べる → 食べられる. する becomes される and 来る becomes 来られる. Japanese also uses a "suffering passive" when the speaker is negatively affected, as in 雨に降られた (I got caught in the rain).',
      examples: [
        { text: '先生に褒められました。', romanization: 'sensei ni homeraremashita.', translation: 'I was praised by the teacher.' },
        { text: '財布を盗まれました。', romanization: 'saifu o nusumaremashita.', translation: 'I had my wallet stolen.' },
        { text: 'この本は多くの人に読まれています。', romanization: 'kono hon wa ōku no hito ni yomarete imasu.', translation: 'This book is read by many people.' },
      ],
      exercises: [
        { prompt: '母に___。', promptTranslation: 'I was scolded by my mother.', options: ['叱られました', '叱りました', '叱らせました', '叱れました'], answerIndex: 0, explanation: '叱る is godan: 叱ら + れる → 叱られました.' },
        { prompt: '電車で足を___。', promptTranslation: 'Someone stepped on my foot on the train.', options: ['踏みました', '踏まれました', '踏ませました', '踏めました'], answerIndex: 1, explanation: '踏む is godan: 踏ま + れる → 踏まれました (suffering passive).' },
        { prompt: '弟にケーキを___。', promptTranslation: 'My cake was eaten by my little brother.', options: ['食べました', '食べさせました', '食べられました', '食べたいです'], answerIndex: 2, explanation: '食べる is ichidan: 食べ + られる → 食べられました.' },
        { prompt: 'このお寺は八百年前に___。', promptTranslation: 'This temple was built 800 years ago.', options: ['建てました', '建てさせました', '建てたいです', '建てられました'], answerIndex: 3, explanation: '建てる is ichidan: 建て + られる → 建てられました.' },
      ],
    },
    'causative': {
      summary: 'The causative form -せる/-させる means "make" or "let" someone do something.',
      explanation:
        'For godan verbs change -u to -a and add せる: 行く → 行かせる, 待つ → 待たせる, 飲む → 飲ませる. For ichidan verbs replace る with させる: 食べる → 食べさせる. する becomes させる and 来る becomes 来させる. The person made to act is marked with に (or を with verbs that take no object), and -させてください politely asks "let me…".',
      examples: [
        { text: '母は子供に野菜を食べさせました。', romanization: 'haha wa kodomo ni yasai o tabesasemashita.', translation: 'The mother made her child eat vegetables.' },
        { text: '待たせてすみません。', romanization: 'matasete sumimasen.', translation: 'Sorry to keep you waiting.' },
        { text: '私にやらせてください。', romanization: 'watashi ni yarasete kudasai.', translation: 'Please let me do it.' },
      ],
      exercises: [
        { prompt: '先生は学生に本を___。', promptTranslation: 'The teacher made the students read a book.', options: ['読ませました', '読まれました', '読みました', '読めました'], answerIndex: 0, explanation: '読む is godan: 読ま + せる → 読ませました.' },
        { prompt: '父は私を一人で旅行に___。', promptTranslation: 'My father let me travel alone.', options: ['行かれました', '行かせました', '行けました', '行きました'], answerIndex: 1, explanation: '行く is godan: 行か + せる → 行かせました.' },
        { prompt: '部長は私に残業を___。', promptTranslation: 'The manager made me work overtime.', options: ['しました', 'されました', 'させました', 'できました'], answerIndex: 2, explanation: 'The causative of する is させる → させました.' },
        { prompt: '少し___ください。', promptTranslation: 'Please let me rest a little.', options: ['休んで', '休まれて', '休めて', '休ませて'], answerIndex: 3, explanation: '休む → 休ませる; -させてください asks for permission: 休ませてください.' },
      ],
    },
    'keigo': {
      summary: 'Keigo uses respectful verbs (尊敬語) to raise others and humble verbs (謙譲語) to lower yourself.',
      explanation:
        'Use 尊敬語 for the actions of customers, bosses or guests: いる/行く/来る → いらっしゃる, 食べる → 召し上がる, 言う → おっしゃる, 見る → ご覧になる. Use 謙譲語 for your own actions toward them: 行く/来る → 参る, 食べる/もらう → いただく, 言う → 申す, 見る → 拝見する. Most other verbs follow お〜になる (respectful) and お〜する (humble).',
      examples: [
        { text: '社長は会議室にいらっしゃいます。', romanization: 'shachō wa kaigishitsu ni irasshaimasu.', translation: 'The company president is in the meeting room.' },
        { text: '私は田中と申します。', romanization: 'watashi wa Tanaka to mōshimasu.', translation: 'My name is Tanaka.' },
        { text: '何を召し上がりますか。', romanization: 'nani o meshiagarimasu ka.', translation: 'What would you like to eat?' },
      ],
      exercises: [
        { prompt: '先生は明日大阪へ___。', promptTranslation: 'The teacher is going to Osaka tomorrow.', options: ['いらっしゃいます', '参ります', 'おります', 'いただきます'], answerIndex: 0, explanation: "The teacher's action needs respectful 尊敬語: いらっしゃいます." },
        { prompt: '明日、私がそちらに___。', promptTranslation: "I'll come to your office tomorrow.", options: ['いらっしゃいます', '参ります', 'おっしゃいます', '召し上がります'], answerIndex: 1, explanation: 'Your own action toward others uses humble 謙譲語: 参ります.' },
        { prompt: 'お客様、こちらのケーキを___か。', promptTranslation: 'Would you like to try this cake?', options: ['いただきます', '申します', '召し上がります', '拝見します'], answerIndex: 2, explanation: "The customer's eating uses 尊敬語: 召し上がります." },
        { prompt: 'では、資料を___。', promptTranslation: "Then I'll take a look at the documents.", options: ['ご覧になります', '召し上がります', 'いらっしゃいます', '拝見します'], answerIndex: 3, explanation: 'Your own looking is humble: 拝見します.' },
      ],
    },
    'you-ni-naru': {
      summary: 'ようになる describes a gradual change ("come to / become able to"), while ようにする describes a conscious effort ("make sure to").',
      explanation:
        'Attach ようになる to a dictionary or potential form to show a change over time: 話せるようになった (I became able to speak). Attach ようにする to a dictionary or ない form to show you try to make something a habit: 毎日運動するようにしている (I make a point of exercising daily), 遅れないようにする (I make sure not to be late).',
      examples: [
        { text: '日本語が話せるようになりました。', romanization: 'nihongo ga hanaseru yō ni narimashita.', translation: 'I became able to speak Japanese.' },
        { text: '毎朝早く起きるようにしています。', romanization: 'maiasa hayaku okiru yō ni shite imasu.', translation: 'I make a point of getting up early every morning.' },
        { text: '最近、子供が野菜を食べるようになった。', romanization: 'saikin, kodomo ga yasai o taberu yō ni natta.', translation: 'Recently my child started eating vegetables.' },
      ],
      exercises: [
        { prompt: '健康のために、毎日野菜を食べるように___。', promptTranslation: 'For my health, I make sure to eat vegetables every day.', options: ['しています', 'なっています', 'なりました', 'できます'], answerIndex: 0, explanation: 'A conscious habit uses ようにする: ようにしています.' },
        { prompt: '一年勉強して、漢字が読めるように___。', promptTranslation: 'After studying for a year, I became able to read kanji.', options: ['しました', 'なりました', 'しています', 'させました'], answerIndex: 1, explanation: 'A change in ability uses ようになる: ようになりました.' },
        { prompt: '忘れない___メモを書きます。', promptTranslation: "I write notes so that I don't forget.", options: ['ために', 'そうに', 'ように', 'ような'], answerIndex: 2, explanation: 'ように after the ない form means "so that … not".' },
        { prompt: '夜遅く食べない___しています。', promptTranslation: 'I try not to eat late at night.', options: ['ようで', 'ようと', 'そうに', 'ように'], answerIndex: 3, explanation: 'ないようにする means "make sure not to".' },
      ],
    },
  },
};
