const I18n = (()=>{
    const strings = {
        en: {
            app_title: 'Gamified Learning',
            nav_home: 'Home', nav_dashboard: 'Dashboard', nav_leaderboard: 'Leaderboard', nav_teacher: 'Teacher', nav_lectures:'Lectures', nav_profile:'Profile', nav_login:'Login', nav_admin:'Admin', nav_spoc:'SPOC',
            btn_save: 'Save', btn_take_quiz: 'Take Quiz', btn_submit: 'Submit', btn_back_dashboard: 'Back to Dashboard',
            home_title: 'Gamified Learning for Rural Education',
            home_tagline: 'Learn Math, Science, and English with fun quizzes, badges, and points. Works offline on your phone.',
            home_cta_start: 'Start Learning',
            subject_math: 'Math', subject_science: 'Science', subject_english: 'English',
            home_card_math: 'Practice numbers, addition, subtraction and more.',
            home_card_science: 'Explore animals, plants, water cycle and energy.',
            home_card_english: 'Learn words, opposites, and simple grammar.',
            home_how_title: 'How it works',
            home_how_badges: 'Earn badges by completing quizzes.',
            home_how_points: 'Collect points and climb the leaderboard.',
            home_how_offline: 'Works offline. Your progress is saved on your device.',
            home_how_language: 'Switch language: English, हिन्दी, ಕನ್ನಡ.',
            label_points: 'Points',
            label_quizzes: 'Quizzes', label_best: 'Best',
            dashboard_title: 'Your Subjects',
            result_title: 'Your Result', label_score: 'Score', label_points_gained: 'Points Gained',
            leaderboard_title: 'Leaderboard', leaderboard_note: 'This leaderboard is stored on your device for offline use.', leaderboard_empty: 'No scores yet. Take a quiz!',
            teacher_title: 'Teacher Dashboard',
            stat_total_students: 'Total Students', stat_total_quizzes: 'Total Quizzes', stat_avg_score: 'Average Score',
            teacher_subject_perf: 'Average Score by Subject', teacher_badges: 'Badges Earned', teacher_no_badges: 'No badges yet.',
            home_trending: 'Trending Quizzes & Games',
            home_trending_desc: 'Try popular quizzes picked for you.',
            btn_explore: 'Explore',
        },
        hi: {
            app_title: 'गेमिफाइड लर्निंग',
            nav_home: 'होम', nav_dashboard: 'डैशबोर्ड', nav_leaderboard: 'लीडरबोर्ड', nav_teacher: 'टीचर', nav_lectures:'लेक्चर', nav_profile:'प्रोफ़ाइल', nav_login:'लॉगिन', nav_admin:'एडमिन', nav_spoc:'SPOC',
            btn_save: 'सेव', btn_take_quiz: 'क्विज़ लें', btn_submit: 'सबमिट', btn_back_dashboard: 'डैशबोर्ड पर वापस',
            home_title: 'ग्रामीण शिक्षा के लिए गेमिफाइड लर्निंग',
            home_tagline: 'मज़ेदार क्विज़, बैज और पॉइंट्स के साथ गणित, विज्ञान और अंग्रेजी सीखें। यह आपके फोन पर ऑफ़लाइन भी काम करती है।',
            home_cta_start: 'सीखना शुरू करें',
            subject_math: 'गणित', subject_science: 'विज्ञान', subject_english: 'अंग्रेज़ी',
            home_card_math: 'संख्या, जोड़, घटाना और अधिक का अभ्यास करें।',
            home_card_science: 'जानवरों, पौधों, जल चक्र और ऊर्जा को जानें।',
            home_card_english: 'शब्द, विलोम और सरल व्याकरण सीखें।',
            home_how_title: 'कैसे काम करता है',
            home_how_badges: 'क्विज़ पूरी करने पर बैज कमाएँ।',
            home_how_points: 'पॉइंट्स जमा करें और लीडरबोर्ड पर चढ़ें।',
            home_how_offline: 'ऑफ़लाइन काम करता है। आपकी प्रगति आपके डिवाइस पर सेव होती है।',
            home_how_language: 'भाषा बदलें: English, हिन्दी, ಕನ್ನಡ.',
            label_points: 'पॉइंट्स',
            label_quizzes: 'क्विज़', label_best: 'सर्वश्रेष्ठ',
            dashboard_title: 'आपके विषय',
            result_title: 'आपका परिणाम', label_score: 'स्कोर', label_points_gained: 'प्राप्त पॉइंट्स',
            leaderboard_title: 'लीडरबोर्ड', leaderboard_note: 'यह लीडरबोर्ड आपके डिवाइस पर ऑफ़लाइन सेव होता है।', leaderboard_empty: 'अभी कोई स्कोर नहीं। क्विज़ लें!',
            teacher_title: 'टीचर डैशबोर्ड',
            stat_total_students: 'कुल छात्र', stat_total_quizzes: 'कुल क्विज़', stat_avg_score: 'औसत स्कोर',
            teacher_subject_perf: 'विषय अनुसार औसत स्कोर', teacher_badges: 'प्राप्त बैज', teacher_no_badges: 'अभी कोई बैज नहीं।',
            home_trending: 'ट्रेंडिंग क्विज़ और गेम्स',
            home_trending_desc: 'आपके लिए चुने लोकप्रिय क्विज़।',
            btn_explore: 'एक्सप्लोर',
        },
        kn: {
            app_title: 'ಗೇಮಿಫೈಡ್ ಲರ್ನಿಂಗ್',
            nav_home: 'ಮುಖಪುಟ', nav_dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', nav_leaderboard: 'ಲೀಡರ್‌ಬೋರ್ಡ್', nav_teacher: 'ಶಿಕ್ಷಕರು', nav_lectures:'ಉಪನ್ಯಾಸಗಳು', nav_profile:'ಪ್ರೊಫೈಲ್', nav_login:'ಲಾಗಿನ್', nav_admin:'ನಿರ್ವಹಣೆ', nav_spoc:'SPOC',
            btn_save: 'ಸೇವ್', btn_take_quiz: 'ಪ್ರಶ್ನೆಪತ್ರ', btn_submit: 'ಸಲ್ಲಿಸಿ', btn_back_dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂದಿರುಗಿ',
            home_title: 'ಗ್ರಾಮೀಣ ಶಿಕ್ಷಣಕ್ಕಾಗಿ ಗೇಮಿಫೈಡ್ ಲರ್ನಿಂಗ್',
            home_tagline: 'ರಸೀಕವಾದ ಪ್ರಶ್ನೆಪತ್ರಿಕೆ, ಬ್ಯಾಡ್ಜ್‌ಗಳು ಮತ್ತು ಅಂಕಗಳೊಂದಿಗೆ ಗಣಿತ, ವಿಜ್ಞಾನ ಮತ್ತು ಇಂಗ್ಲಿಷ್ ಕಲಿಯಿರಿ. ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ.',
            home_cta_start: 'ಆರಂಭಿಸಿ',
            subject_math: 'ಗಣಿತ', subject_science: 'ವಿಜ್ಞಾನ', subject_english: 'ಇಂಗ್ಲಿಷ್',
            home_card_math: 'ಸಂಖ್ಯೆಗಳು, ಜೋಡಣೆ, ಕಡಿತ ಮತ್ತು ಇನ್ನಷ್ಟು ಅಭ್ಯಾಸ ಮಾಡಿ.',
            home_card_science: 'ಪ್ರಾಣಿಗಳು, ಸಸ್ಯಗಳು, ಜಲಚಕ್ರ ಮತ್ತು ಶಕ್ತಿಯನ್ನು ತಿಳಿಯಿರಿ.',
            home_card_english: 'ಪದಗಳು, ವಿರುದ್ಧಾರ್ಥಕಗಳು ಮತ್ತು ಸರಳ ವ್ಯಾಕರಣ ಕಲಿಯಿರಿ.',
            home_how_title: 'ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
            home_how_badges: 'ಪ್ರಶ್ನೆಪತ್ರಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ ಬ್ಯಾಡ್ಜ್ ಗಳಿಸಿ.',
            home_how_points: 'ಅಂಕಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ ಮತ್ತು ಲೀಡರ್‌ಬೋರ್ಡ್ ಏರಿ.',
            home_how_offline: 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕೆಲಸ. ನಿಮ್ಮ ಪ್ರಗತಿ ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ ಉಳಿಯುತ್ತದೆ.',
            home_how_language: 'ಭಾಷೆ ಬದಲಿಸಿ: English, हिन्दी, ಕನ್ನಡ.',
            label_points: 'ಅಂಕಗಳು',
            label_quizzes: 'ಪ್ರಶ್ನೆಪತ್ರ', label_best: 'ಉತ್ತಮ',
            dashboard_title: 'ನಿಮ್ಮ ವಿಷಯಗಳು',
            result_title: 'ನಿಮ್ಮ ಫಲಿತಾಂಶ', label_score: 'ಅಂಕ%', label_points_gained: 'ಪಡೆಯದ ಅಂಕಗಳು',
            leaderboard_title: 'ಲೀಡರ್‌ಬೋರ್ಡ್', leaderboard_note: 'ಈ ಲೀಡರ್‌ಬೋರ್ಡ್ ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ ಆಫ್‌ಲೈನ್ ಸಂಗ್ರಹವಾಗಿದೆ.', leaderboard_empty: 'ಇನ್ನೂ ಯಾವುದೇ ಅಂಕಗಳಿಲ್ಲ. ಪ್ರಶ್ನೆಪತ್ರ ತೆಗೆದುಕೊಳ್ಳಿ!',
            teacher_title: 'ಶಿಕ್ಷಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
            stat_total_students: 'ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು', stat_total_quizzes: 'ಒಟ್ಟು ಪ್ರಶ್ನೆಪತ್ರ', stat_avg_score: 'ಸರಾಸರಿ ಅಂಕ',
            teacher_subject_perf: 'ವಿಷಯವಾರು ಸರಾಸರಿ ಅಂಕ', teacher_badges: 'ಪಡೆಯದ ಬ್ಯಾಡ್ಜ್‌ಗಳು', teacher_no_badges: 'ಇನ್ನೂ ಯಾವುದೇ ಬ್ಯಾಡ್ಜ್ ಇಲ್ಲ.',
            home_trending: 'ಟ್ರೆಂಡಿಂಗ್ ಪ್ರಶ್ನೆಪತ್ರಿಕೆ ಮತ್ತು ಆಟಗಳು',
            home_trending_desc: 'ನಿಮಗಾಗಿ ಆಯ್ದ ಜನಪ್ರಿಯ ಪ್ರಶ್ನೆಪತ್ರಿಕೆಗಳು.',
            btn_explore: 'ಅನ್ವೇಷಿಸಿ',
        }
    };

    function t(key){
        const lang = StorageAPI.getLanguage();
        return (strings[lang] && strings[lang][key]) || strings.en[key] || key;
    }

    function apply(){
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
        const select = document.getElementById('langSelect');
        if (select){ select.value = StorageAPI.getLanguage(); }
    }

    return { t, apply };
})();


