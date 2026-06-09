/**
 * 补充词库 + 导入段落翻译数据
 */
const { initDb, getDb, get, all, run } = require('./db');

const extraWords = [
  { w: 'allocate', ph: '/ˈæləkeɪt/', pos: 'v.', cn: '分配，拨出', en: 'to distribute for a purpose', se: 'The government allocated $10 million for disaster relief.', sc: '政府拨款一千万美元用于救灾。', f: 4, d: 2 },
  { w: 'alarming', ph: '/əˈlɑːmɪŋ/', pos: 'adj.', cn: '惊人的，令人担忧的', en: 'causing worry or fear', se: 'The deforestation rate is alarming.', sc: '森林砍伐的速度令人担忧。', f: 3, d: 2 },
  { w: 'appreciate', ph: '/əˈpriːʃieɪt/', pos: 'v.', cn: '欣赏，感激，升值', en: 'to recognize the value of', se: 'We appreciate your continued support.', sc: '我们感谢你们持续的支持。', f: 4, d: 1 },
  { w: 'artificial', ph: '/ˌɑːtɪˈfɪʃl/', pos: 'adj.', cn: '人造的，虚假的', en: 'made by human beings', se: 'Artificial intelligence is transforming many industries.', sc: '人工智能正在改变许多行业。', f: 4, d: 1 },
  { w: 'associate', ph: '/əˈsəʊʃieɪt/', pos: 'v./n.', cn: '关联；同事', en: 'to connect in the mind', se: 'People often associate stress with high blood pressure.', sc: '人们常把压力与高血压联系在一起。', f: 4, d: 1 },
  { w: 'authority', ph: '/ɔːˈθɒrəti/', pos: 'n.', cn: '权威，当局', en: 'the power to give orders', se: 'The local authorities are responsible for public safety.', sc: '地方当局负责公共安全。', f: 4, d: 1 },
  { w: 'automatic', ph: '/ˌɔːtəˈmætɪk/', pos: 'adj.', cn: '自动的，无意识的', en: 'working by itself', se: 'The process is fully automatic and requires no human intervention.', sc: '这个过程是全自动的，无需人工干预。', f: 3, d: 1 },
  { w: 'boom', ph: '/buːm/', pos: 'n./v.', cn: '繁荣，暴涨', en: 'a period of rapid growth', se: 'The tech boom of the 1990s created many millionaires.', sc: '1990年代的技术繁荣造就了许多百万富翁。', f: 3, d: 2 },
  { w: 'boundary', ph: '/ˈbaʊndri/', pos: 'n.', cn: '边界，界限', en: 'a dividing line', se: 'The river forms the boundary between the two countries.', sc: '这条河构成了两国之间的边界。', f: 3, d: 2 },
  { w: 'candidate', ph: '/ˈkændɪdət/', pos: 'n.', cn: '候选人，应试者', en: 'a person applying for a job or position', se: 'There are three candidates for the position of manager.', sc: '有三个候选人竞争经理职位。', f: 3, d: 1 },
  { w: 'climate', ph: '/ˈklaɪmət/', pos: 'n.', cn: '气候，风气', en: 'the weather conditions prevailing in an area', se: 'Climate change is one of the greatest challenges of our time.', sc: '气候变化是我们时代最大的挑战之一。', f: 4, d: 1 },
  { w: 'commercial', ph: '/kəˈmɜːʃl/', pos: 'adj./n.', cn: '商业的；广告', en: 'relating to commerce', se: 'The commercial district is crowded during business hours.', sc: '商业区在营业时间很拥挤。', f: 4, d: 1 },
  { w: 'communicate', ph: '/kəˈmjuːnɪkeɪt/', pos: 'v.', cn: '交流，传达', en: 'to share information', se: 'Effective managers communicate clearly with their teams.', sc: '有效的管理者与团队沟通清晰。', f: 4, d: 1 },
  { w: 'community', ph: '/kəˈmjuːnəti/', pos: 'n.', cn: '社区，团体', en: 'a group of people living together', se: 'The local community came together to support the charity event.', sc: '当地社区团结起来支持慈善活动。', f: 4, d: 1 },
  { w: 'companion', ph: '/kəmˈpæniən/', pos: 'n.', cn: '同伴，伙伴', en: 'a person you spend time with', se: 'Dogs have been faithful companions to humans for thousands of years.', sc: '几千年来，狗一直是人类忠实的伙伴。', f: 3, d: 1 },
  { w: 'comparable', ph: '/ˈkɒmpərəbl/', pos: 'adj.', cn: '可比较的，类似的', en: 'able to be compared', se: 'The two products are comparable in quality and price.', sc: '这两种产品在质量和价格上具有可比性。', f: 3, d: 2 },
  { w: 'compel', ph: '/kəmˈpel/', pos: 'v.', cn: '强迫，迫使', en: 'to force someone to do something', se: 'The law compels employers to provide safe working conditions.', sc: '法律强迫雇主提供安全的工作条件。', f: 3, d: 2 },
  { w: 'compete', ph: '/kəmˈpiːt/', pos: 'v.', cn: '竞争，比赛', en: 'to strive for something', se: 'Companies must constantly innovate to compete in the global market.', sc: '公司必须不断创新才能在全球市场竞争。', f: 4, d: 1 },
  { w: 'complex', ph: '/ˈkɒmpleks/', pos: 'adj.', cn: '复杂的，综合的', en: 'consisting of many parts', se: 'The human brain is an incredibly complex organ.', sc: '人类大脑是一个极其复杂的器官。', f: 4, d: 1 },
  { w: 'comprehensive', ph: '/ˌkɒmprɪˈhensɪv/', pos: 'adj.', cn: '全面的，综合的', en: 'including everything', se: 'The report provides a comprehensive analysis of the market.', sc: '报告对市场进行了全面分析。', f: 3, d: 2 },
  { w: 'confine', ph: '/kənˈfaɪn/', pos: 'v.', cn: '限制，禁闭', en: 'to keep within limits', se: 'The disease was confined to a small area.', sc: '疾病被控制在一个小区域内。', f: 3, d: 2 },
  { w: 'conflict', ph: '/ˈkɒnflɪkt/', pos: 'n./v.', cn: '冲突，矛盾', en: 'a serious disagreement', se: 'The conflict between the two nations has lasted for decades.', sc: '两国之间的冲突已持续数十年。', f: 4, d: 1 },
  { w: 'confront', ph: '/kənˈfrʌnt/', pos: 'v.', cn: '面对，对抗', en: 'to face up to', se: 'We must confront the challenges of climate change head-on.', sc: '我们必须正面应对气候变化的挑战。', f: 3, d: 2 },
  { w: 'conscious', ph: '/ˈkɒnʃəs/', pos: 'adj.', cn: '有意识的，自觉的', en: 'aware of something', se: 'Many consumers are now more environmentally conscious.', sc: '现在许多消费者的环保意识更强了。', f: 3, d: 2 },
  { w: 'consequence', ph: '/ˈkɒnsɪkwəns/', pos: 'n.', cn: '结果，后果', en: 'a result or effect', se: 'Global warming has serious consequences for the planet.', sc: '全球变暖对地球有严重后果。', f: 4, d: 1 },
  { w: 'construct', ph: '/kənˈstrʌkt/', pos: 'v.', cn: '建造，构筑', en: 'to build or form', se: 'The bridge was constructed in 1998.', sc: '这座桥建于1998年。', f: 3, d: 1 },
  { w: 'consume', ph: '/kənˈsjuːm/', pos: 'v.', cn: '消费，消耗', en: 'to use up', se: 'Americans consume a large amount of energy per person.', sc: '美国人的人均能源消耗量很大。', f: 3, d: 1 },
  { w: 'context', ph: '/ˈkɒntekst/', pos: 'n.', cn: '上下文，背景', en: 'the circumstances surrounding an event', se: 'The decision must be understood in its historical context.', sc: '这一决定必须放在历史背景下理解。', f: 4, d: 1 },
  { w: 'contract', ph: '/ˈkɒntrækt/', pos: 'n./v.', cn: '合同；收缩', en: 'a written agreement', se: 'Both parties signed the contract yesterday.', sc: '双方昨天签署了合同。', f: 3, d: 1 },
  { w: 'contrast', ph: '/ˈkɒntrɑːst/', pos: 'n./v.', cn: '对比，差异', en: 'the state of being strikingly different', se: 'In contrast to urban areas, rural regions have limited access to healthcare.', sc: '与城市地区相比，农村地区的医疗资源有限。', f: 3, d: 1 },
  { w: 'contribute', ph: '/kənˈtrɪbjuːt/', pos: 'v.', cn: '贡献，捐献', en: 'to give in common with others', se: 'Everyone should contribute to protecting the environment.', sc: '每个人都应为保护环境做出贡献。', f: 4, d: 1 },
  { w: 'controversial', ph: '/ˌkɒntrəˈvɜːʃl/', pos: 'adj.', cn: '有争议的', en: 'causing public disagreement', se: 'The controversial policy sparked nationwide protests.', sc: '这项有争议的政策引发了全国范围的抗议。', f: 3, d: 2 },
  { w: 'convenient', ph: '/kənˈviːniənt/', pos: 'adj.', cn: '方便的，便利的', en: 'suitable for one\'s purpose', se: 'Online shopping is convenient for people with busy schedules.', sc: '网购对日程繁忙的人很方便。', f: 3, d: 1 },
  { w: 'convey', ph: '/kənˈveɪ/', pos: 'v.', cn: '传达，运输', en: 'to communicate or transport', se: 'The poem conveys a deep sense of loss.', sc: '这首诗传达出一种深深的失落感。', f: 3, d: 2 },
  { w: 'cooperate', ph: '/kəʊˈɒpəreɪt/', pos: 'v.', cn: '合作，配合', en: 'to work together', se: 'The two companies agreed to cooperate on the research project.', sc: '两家公司同意在研究项目上合作。', f: 3, d: 1 },
  { w: 'correspond', ph: '/ˌkɒrəˈspɒnd/', pos: 'v.', cn: '对应，通信', en: 'to match or be equivalent', se: 'The findings correspond with earlier research.', sc: '这些发现与早期的研究相符。', f: 3, d: 2 },
  { w: 'crisis', ph: '/ˈkraɪsɪs/', pos: 'n.', cn: '危机，紧要关头', en: 'a time of intense difficulty', se: 'The economic crisis affected millions of people worldwide.', sc: '经济危机影响了全球数百万人。', f: 3, d: 1 },
  { w: 'criteria', ph: '/kraɪˈtɪəriə/', pos: 'n.', cn: '标准，条件', en: 'standards for judging', se: 'Applicants must meet strict criteria to be considered.', sc: '申请人必须符合严格的标准才能被考虑。', f: 3, d: 2 },
  { w: 'cultivate', ph: '/ˈkʌltɪveɪt/', pos: 'v.', cn: '培养，耕作', en: 'to develop or improve', se: 'Schools should cultivate students\' critical thinking skills.', sc: '学校应该培养学生的批判性思维能力。', f: 3, d: 2 },
  { w: 'decade', ph: '/ˈdekeɪd/', pos: 'n.', cn: '十年', en: 'a period of ten years', se: 'Over the past decade, technology has advanced rapidly.', sc: '过去十年里，技术发展迅速。', f: 4, d: 1 },
  { w: 'defeat', ph: '/dɪˈfiːt/', pos: 'v./n.', cn: '击败，战胜', en: 'to overcome an opponent', se: 'The team suffered a humiliating defeat.', sc: '该队遭受了耻辱性的失败。', f: 3, d: 1 },
  { w: 'defend', ph: '/dɪˈfend/', pos: 'v.', cn: '保卫，辩护', en: 'to protect from harm', se: 'The army was sent to defend the border.', sc: '军队被派去保卫边境。', f: 3, d: 1 },
  { w: 'deficit', ph: '/ˈdefɪsɪt/', pos: 'n.', cn: '赤字，不足', en: 'the amount by which something falls short', se: 'The budget deficit has reached record levels.', sc: '预算赤字已达到历史最高水平。', f: 3, d: 3 },
  { w: 'define', ph: '/dɪˈfaɪn/', pos: 'v.', cn: '定义，界定', en: 'to state the meaning of', se: 'The constitution defines the powers of the president.', sc: '宪法界定了总统的权力。', f: 3, d: 1 },
  { w: 'definite', ph: '/ˈdefɪnət/', pos: 'adj.', cn: '明确的，确定的', en: 'clearly stated or decided', se: 'We need a definite answer by Friday.', sc: '我们周五前需要明确的答复。', f: 3, d: 1 },
  { w: 'delay', ph: '/dɪˈleɪ/', pos: 'v./n.', cn: '延迟，推迟', en: 'to postpone', se: 'The flight was delayed due to bad weather.', sc: '航班因天气恶劣而延误。', f: 3, d: 1 },
  { w: 'deliberate', ph: '/dɪˈlɪbərət/', pos: 'adj./v.', cn: '故意的；深思熟虑', en: 'done on purpose', se: 'The decision was the result of deliberate consideration.', sc: '这个决定是深思熟虑的结果。', f: 3, d: 2 },
  { w: 'demand', ph: '/dɪˈmɑːnd/', pos: 'n./v.', cn: '需求，要求', en: 'an insistent request', se: 'The demand for renewable energy is growing rapidly.', sc: '对可再生能源的需求正在快速增长。', f: 4, d: 1 },
  { w: 'democracy', ph: '/dɪˈmɒkrəsi/', pos: 'n.', cn: '民主，民主制度', en: 'a system of government by the people', se: 'Democracy is based on the principle of majority rule.', sc: '民主基于多数人统治的原则。', f: 3, d: 2 },
  { w: 'dependent', ph: '/dɪˈpendənt/', pos: 'adj.', cn: '依赖的，从属的', en: 'relying on someone or something', se: 'The country is heavily dependent on oil exports.', sc: '该国严重依赖石油出口。', f: 3, d: 1 },
  { w: 'deposit', ph: '/dɪˈpɒzɪt/', pos: 'n./v.', cn: '存款，押金；存放', en: 'a sum of money placed in a bank', se: 'You need to pay a deposit to reserve the apartment.', sc: '你需要支付押金来预订公寓。', f: 3, d: 2 },
  { w: 'derive', ph: '/dɪˈraɪv/', pos: 'v.', cn: '源自，获得', en: 'to obtain from a source', se: 'Many English words derive from Latin.', sc: '许多英语单词源自拉丁语。', f: 3, d: 2 },
  { w: 'desperate', ph: '/ˈdespərət/', pos: 'adj.', cn: '绝望的，拼命的', en: 'feeling hopeless', se: 'The family was desperate for financial assistance.', sc: '这家人急需经济援助。', f: 3, d: 2 },
  { w: 'destination', ph: '/ˌdestɪˈneɪʃn/', pos: 'n.', cn: '目的地，终点', en: 'the place where a journey ends', se: 'Paris is one of the most popular tourist destinations in the world.', sc: '巴黎是世界上最受欢迎的旅游目的地之一。', f: 3, d: 1 },
  { w: 'destruction', ph: '/dɪˈstrʌkʃn/', pos: 'n.', cn: '破坏，毁灭', en: 'the act of destroying', se: 'The earthquake caused widespread destruction.', sc: '地震造成了广泛的破坏。', f: 3, d: 2 },
  { w: 'detect', ph: '/dɪˈtekt/', pos: 'v.', cn: '察觉，发现', en: 'to discover or notice', se: 'The test can detect the presence of harmful bacteria.', sc: '该测试可以检测有害细菌的存在。', f: 3, d: 1 },
  { w: 'deteriorate', ph: '/dɪˈtɪəriəreɪt/', pos: 'v.', cn: '恶化，退化', en: 'to become worse', se: 'The patient\'s condition deteriorated rapidly.', sc: '病人的状况迅速恶化。', f: 3, d: 3 },
  { w: 'diagnose', ph: '/ˈdaɪəɡnəʊz/', pos: 'v.', cn: '诊断，判断', en: 'to identify an illness', se: 'The doctor diagnosed her with a rare disease.', sc: '医生诊断她患了一种罕见的疾病。', f: 3, d: 2 },
  { w: 'dimension', ph: '/daɪˈmenʃn/', pos: 'n.', cn: '维度，方面', en: 'an aspect or feature', se: 'The problem has a social as well as an economic dimension.', sc: '这个问题既有社会维度也有经济维度。', f: 3, d: 2 },
  { w: 'discipline', ph: '/ˈdɪsəplɪn/', pos: 'n./v.', cn: '纪律，学科；训练', en: 'the practice of training to obey rules', se: 'Learning a musical instrument requires patience and discipline.', sc: '学习乐器需要耐心和纪律。', f: 3, d: 2 },
  { w: 'discount', ph: '/ˈdɪskaʊnt/', pos: 'n./v.', cn: '折扣；不重视', en: 'a reduction in price', se: 'Students get a discount on public transportation.', sc: '学生乘坐公共交通可享受折扣。', f: 3, d: 1 },
  { w: 'discrimination', ph: '/dɪˌskrɪmɪˈneɪʃn/', pos: 'n.', cn: '歧视，辨别', en: 'unfair treatment based on group membership', se: 'The law prohibits discrimination based on gender or race.', sc: '法律禁止基于性别或种族的歧视。', f: 3, d: 2 },
  { w: 'display', ph: '/dɪˈspleɪ/', pos: 'v./n.', cn: '展示，陈列', en: 'to put something where it can be seen', se: 'The museum displays artifacts from ancient civilizations.', sc: '博物馆展示了古代文明的文物。', f: 3, d: 1 },
  { w: 'dispute', ph: '/dɪˈspjuːt/', pos: 'n./v.', cn: '争论，争端', en: 'a disagreement', se: 'The labor dispute was finally settled through negotiation.', sc: '劳资争端最终通过谈判解决了。', f: 3, d: 2 },
  { w: 'distinct', ph: '/dɪˈstɪŋkt/', pos: 'adj.', cn: '明显的，独特的', en: 'clearly different', se: 'The two species are distinct from each other.', sc: '这两个物种彼此不同。', f: 3, d: 1 },
  { w: 'distinguish', ph: '/dɪˈstɪŋɡwɪʃ/', pos: 'v.', cn: '区分，辨别', en: 'to recognize differences', se: 'It is often difficult to distinguish between genuine and fake products.', sc: '区分真伪产品往往很困难。', f: 3, d: 2 },
  { w: 'distribute', ph: '/dɪˈstrɪbjuːt/', pos: 'v.', cn: '分配，分发', en: 'to give out to each', se: 'The organization distributes food to homeless people.', sc: '该组织向无家可归者分发食物。', f: 3, d: 1 },
  { w: 'diverse', ph: '/daɪˈvɜːs/', pos: 'adj.', cn: '多样的，不同的', en: 'showing a great deal of variety', se: 'The university has a diverse student population.', sc: '这所大学的学生群体多样化。', f: 4, d: 1 },
  { w: 'document', ph: '/ˈdɒkjumənt/', pos: 'n./v.', cn: '文件；记录', en: 'a written or printed record', se: 'Please sign the document at the bottom.', sc: '请在文件底部签字。', f: 3, d: 1 },
  { w: 'domestic', ph: '/dəˈmestɪk/', pos: 'adj.', cn: '国内的，家庭的', en: 'relating to a home or home country', se: 'The government aims to boost domestic consumption.', sc: '政府旨在提振国内消费。', f: 4, d: 1 },
  { w: 'dominate', ph: '/ˈdɒmɪneɪt/', pos: 'v.', cn: '支配，主导', en: 'to have power over', se: 'The tech giant dominates the global smartphone market.', sc: '这家科技巨头主导着全球智能手机市场。', f: 3, d: 2 },
  { w: 'draft', ph: '/drɑːft/', pos: 'n./v.', cn: '草稿；起草', en: 'a preliminary version', se: 'The first draft of the report is due next week.', sc: '报告的初稿下周截止。', f: 3, d: 1 },
  { w: 'drain', ph: '/dreɪn/', pos: 'v./n.', cn: '排水，耗尽', en: 'to remove liquid or exhaust', se: 'The war drained the country\'s resources.', sc: '战争耗尽了该国的资源。', f: 3, d: 2 },
  { w: 'economic', ph: '/ˌiːkəˈnɒmɪk/', pos: 'adj.', cn: '经济的，经济学的', en: 'relating to the economy', se: 'The country faces serious economic challenges.', sc: '该国面临着严峻的经济挑战。', f: 5, d: 1 },
  { w: 'edge', ph: '/edʒ/', pos: 'n.', cn: '边缘，优势', en: 'the border or advantage', se: 'The new technology gives the company a competitive edge.', sc: '新技术给了这家公司竞争优势。', f: 3, d: 1 },
  { w: 'effective', ph: '/ɪˈfektɪv/', pos: 'adj.', cn: '有效的，生效的', en: 'producing the desired result', se: 'The new drug is effective against the virus.', sc: '新药对这种病毒有效。', f: 4, d: 1 },
  { w: 'efficiency', ph: '/ɪˈfɪʃnsi/', pos: 'n.', cn: '效率，效能', en: 'the state of being efficient', se: 'We need to improve the efficiency of our production process.', sc: '我们需要提高生产流程的效率。', f: 3, d: 2 },
  { w: 'elaborate', ph: '/ɪˈlæbərət/', pos: 'adj./v.', cn: '详细的；详细说明', en: 'involving many carefully arranged parts', se: 'The witness gave an elaborate account of the incident.', sc: '证人对事件作了详细描述。', f: 3, d: 2 },
  { w: 'elderly', ph: '/ˈeldəli/', pos: 'adj.', cn: '年老的，年长的', en: 'old or aging', se: 'The government provides support for elderly citizens.', sc: '政府为老年公民提供支持。', f: 3, d: 1 },
  { w: 'electronic', ph: '/ɪˌlekˈtrɒnɪk/', pos: 'adj.', cn: '电子的', en: 'relating to electronics', se: 'Electronic devices have become an essential part of modern life.', sc: '电子设备已成为现代生活的重要组成部分。', f: 3, d: 1 },
  { w: 'element', ph: '/ˈelɪmənt/', pos: 'n.', cn: '元素，要素', en: 'a fundamental component', se: 'Trust is an essential element of any relationship.', sc: '信任是任何关系的基本要素。', f: 3, d: 1 },
  { w: 'embrace', ph: '/ɪmˈbreɪs/', pos: 'v./n.', cn: '拥抱，采纳', en: 'to accept willingly', se: 'Many companies have embraced remote work as a permanent option.', sc: '许多公司已接受远程办公作为永久选项。', f: 3, d: 2 },
  { w: 'emerge', ph: '/ɪˈmɜːdʒ/', pos: 'v.', cn: '出现，浮现', en: 'to come out into view', se: 'New challenges emerge as technology advances.', sc: '随着技术进步，新挑战不断出现。', f: 3, d: 1 },
  { w: 'emission', ph: '/ɪˈmɪʃn/', pos: 'n.', cn: '排放，散发', en: 'the production and discharge of something', se: 'The government plans to reduce carbon emissions by 50%.', sc: '政府计划将碳排放减少50%。', f: 3, d: 2 },
  { w: 'emotion', ph: '/ɪˈməʊʃn/', pos: 'n.', cn: '情感，情绪', en: 'a strong feeling', se: 'The film evokes a wide range of emotions.', sc: '这部电影唤起了广泛的情感。', f: 3, d: 1 },
  { w: 'emphasis', ph: '/ˈemfəsɪs/', pos: 'n.', cn: '强调，重点', en: 'special importance', se: 'The school places great emphasis on moral education.', sc: '学校非常重视道德教育。', f: 3, d: 2 },
  { w: 'employee', ph: '/ɪmˈplɔɪiː/', pos: 'n.', cn: '雇员，员工', en: 'a person employed for wages', se: 'The company has over 10,000 employees worldwide.', sc: '该公司在全球有一万多名员工。', f: 4, d: 1 },
  { w: 'employment', ph: '/ɪmˈplɔɪmənt/', pos: 'n.', cn: '就业，雇佣', en: 'the state of having paid work', se: 'The government is working to increase employment opportunities.', sc: '政府正在努力增加就业机会。', f: 3, d: 1 },
  { w: 'encounter', ph: '/ɪnˈkaʊntə/', pos: 'v./n.', cn: '遭遇，邂逅', en: 'to meet unexpectedly', se: 'She encountered many difficulties during her research.', sc: '她在研究过程中遇到了许多困难。', f: 3, d: 2 },
];

const passages = [
  {
    title: '气候变化的影响',
    passage_en: 'Climate change is having a profound impact on our planet. The global temperature has been rising at an alarming rate over the past decade. Scientists warn that if we fail to reduce carbon emissions, the consequences will be catastrophic. We must take immediate action to protect vulnerable ecosystems.',
    passage_cn: '气候变化正在对我们的星球产生深远影响。过去十年间，全球气温以惊人的速度上升。科学家警告说，如果我们不能减少碳排放，后果将是灾难性的。我们必须立即采取行动来保护脆弱的生态系统。',
    words: 'climate,profound,decade,alarming,emission,consequence,critical,vulnerable',
    difficulty: 2
  },
  {
    title: '人工智能与就业',
    passage_en: 'Artificial intelligence is transforming the workplace in fundamental ways. While this technology can significantly improve efficiency, many workers fear that automation may eliminate their jobs. Experts argue that we must invest in education and training to help people adapt to this changing landscape.',
    passage_cn: '人工智能正在从根本上改变工作场所。虽然这项技术可以显著提高效率，但许多工人担心自动化可能会消除他们的工作。专家认为，我们必须投资于教育和培训，帮助人们适应这种变化的环境。',
    words: 'artificial,fundamental,significant,efficiency,eliminate,invest,adapt',
    difficulty: 2
  },
  {
    title: '城市化趋势',
    passage_en: 'The trend toward urbanization continues to accelerate across the developing world. As people move from rural areas to cities in search of better opportunities, urban populations are expanding rapidly. This shift presents both opportunities and challenges for governments, who must ensure adequate housing, transportation, and public services for all residents.',
    passage_cn: '城市化趋势在发展中国家持续加速。随着人们从农村地区迁往城市寻找更好的机会，城市人口正在迅速扩大。这一转变为政府带来了机遇和挑战，政府必须确保为所有居民提供充足的住房、交通和公共服务。',
    words: 'trend,urban,rural,accelerate,expand,shift,adequate',
    difficulty: 3
  },
  {
    title: '可持续能源转型',
    passage_en: 'The transition to sustainable energy sources is essential for combating climate change. Solar and wind power have become increasingly cost-effective, making them viable alternatives to fossil fuels. However, significant investment in infrastructure is still required to guarantee a stable energy supply. Governments around the world must cooperate to accelerate this transition.',
    passage_cn: '向可持续能源的转型对应对气候变化至关重要。太阳能和风能已经变得越来越具有成本效益，成为化石燃料的可行替代品。然而，仍然需要在基础设施方面进行大量投资，以保证稳定的能源供应。世界各国政府必须合作加速这一转变。',
    words: 'sustainable,essential,alternative,investment,guarantee,stable,supply,cooperate',
    difficulty: 3
  },
  {
    title: '教育方式的变革',
    passage_en: 'The traditional approach to education is being challenged by new technologies. Online learning platforms have made education more accessible than ever before, allowing students to learn at their own pace. Nevertheless, critics argue that the lack of face-to-face interaction may have negative consequences for students\' social development. The challenge is to integrate technology while maintaining educational quality.',
    passage_cn: '传统的教育方式正受到新技术的挑战。在线学习平台使教育比以往任何时候都更加 accessible，让学生可以按照自己的节奏学习。然而，批评者认为缺乏面对面交流可能对学生的社交发展产生负面影响。挑战在于在保持教育质量的同时整合技术。',
    words: 'traditional,approach,accessible,nevertheless,consequence,integrate,maintain',
    difficulty: 3
  },
  {
    title: '医疗资源分配',
    passage_en: 'The allocation of healthcare resources is a persistent challenge for governments worldwide. In many rural areas, residents have limited access to medical services, while urban hospitals are often overcrowded. Health authorities must find ways to distribute resources more equitably. Some experts advocate for increased investment in telemedicine to bridge the gap between rural and urban healthcare.',
    passage_cn: '医疗资源的分配是全球政府面临的持续挑战。在许多农村地区，居民获得医疗服务的机会有限，而城市医院往往人满为患。卫生当局必须找到更公平地分配资源的方法。一些专家主张加大对远程医疗的投资，以弥合城乡医疗保健之间的差距。',
    words: 'allocate,resource,challenge,rural,urban,authority,distribute,advocate',
    difficulty: 3
  },
  {
    title: '社交媒体与社会关系',
    passage_en: 'Social media has dramatically transformed how people communicate and maintain relationships. While these platforms enable us to stay connected with friends across long distances, some researchers express concern that they may weaken genuine face-to-face social bonds. The key is to strike a balance between online and offline interactions, ensuring that technology enhances rather than replaces meaningful human connections.',
    passage_cn: '社交媒体极大地改变了人们的沟通和维持关系的方式。虽然这些平台使我们能够与远方的朋友保持联系，但一些研究人员担心它们可能削弱真正的面对面社交纽带。关键在于在线和离线互动之间取得平衡，确保技术增强而非取代有意义的人际联系。',
    words: 'dramatic,transform,communicate,maintain,enable,genuine,enhance',
    difficulty: 2
  },
  {
    title: '全球化与文化交流',
    passage_en: 'Globalization has brought about unprecedented cultural exchange between nations. Contemporary art, music, and cuisine increasingly reflect a blend of diverse traditions. However, there is a growing concern that this trend may threaten local cultural identities. The challenge for modern societies is to embrace cultural diversity while preserving their unique heritage.',
    passage_cn: '全球化带来了国家间前所未有的文化交流。当代艺术、音乐和美食日益反映出多元传统的融合。然而，越来越多的人担心这一趋势可能威胁到地方文化认同。现代社会面临的挑战是在拥抱文化多样性的同时保护其独特的遗产。',
    words: 'global,diverse,contemporary,trend,embrace,unique',
    difficulty: 2
  },
  // ── 新增段落 ──
  {
    title: '科技对就业的影响',
    passage_en: 'The rapid advancement of technology has fundamentally transformed the labor market. While automation has eliminated certain routine jobs, it has also created new opportunities in emerging fields such as artificial intelligence and data analysis. The key challenge for workers is to continuously upgrade their skills to remain competitive in this evolving landscape.',
    passage_cn: '技术的快速发展从根本上改变了劳动力市场。虽然自动化消除了某些常规工作，但它也在人工智能和数据分析等新兴领域创造了新的机会。工人们面临的关键挑战是持续提升技能以在这个不断变化的环境中保持竞争力。',
    words: 'fundamental,transform,eliminate,emerge,artificial,challenge,evaluate,evolve',
    difficulty: 2
  },
  {
    title: '环境保护与经济发展',
    passage_en: 'The conflict between environmental protection and economic development has been a persistent topic of debate. Critics argue that environmental regulations impose excessive burdens on businesses and hinder economic growth. However, advocates of sustainable development contend that green technologies can actually stimulate innovation and create new job opportunities.',
    passage_cn: '环境保护与经济发展之间的冲突一直是一个争论不休的话题。批评者认为环境法规给企业带来了过重负担，阻碍了经济增长。然而，可持续发展的倡导者认为绿色技术实际上可以刺激创新并创造新的就业机会。',
    words: 'conflict,persistent,impose,advocate,sustainable,stimulate,innovation,opportunity',
    difficulty: 3
  },
  {
    title: '网络安全挑战',
    passage_en: 'As our reliance on digital infrastructure grows, cybersecurity has become a critical concern for both governments and corporations. Cyber attacks have become increasingly sophisticated, threatening not only personal privacy but also national security. Experts emphasize that addressing these threats requires international cooperation and constant vigilance.',
    passage_cn: '随着我们对数字基础设施依赖的增加，网络安全已成为政府和企业的重要关切。网络攻击变得越来越复杂，不仅威胁到个人隐私，还威胁到国家安全。专家强调，应对这些威胁需要国际合作和持续警惕。',
    words: 'reliance,critical,threaten,privacy,security,emphasize,cooperate',
    difficulty: 2
  },
  {
    title: '大学教育的目的',
    passage_en: 'The purpose of university education has been the subject of intense debate in recent years. While some argue that its primary function is to prepare students for the job market, others contend that higher education should cultivate critical thinking and broaden intellectual horizons. The ideal approach may be to integrate both practical skills and liberal arts education.',
    passage_cn: '大学教育的目的近年来一直是激烈争论的话题。有人认为其主要功能是为学生就业做准备，而另一些人则主张高等教育应培养批判性思维并拓宽知识视野。理想的方法可能是将实用技能与通识教育相结合。',
    words: 'intense,debate,primary,function,cultivate,integrate,approach',
    difficulty: 3
  },
  {
    title: '消费主义与社会',
    passage_en: 'Consumerism has become a dominant force in modern society, shaping not only economic patterns but also cultural values and personal identities. Critics contend that excessive consumption is both environmentally unsustainable and psychologically detrimental, fostering a culture of materialism that undermines genuine human well-being.',
    passage_cn: '消费主义已成为现代社会的主导力量，不仅塑造了经济模式，还影响了文化价值观和个人身份认同。批评者认为过度消费在环境上不可持续，在心理上也有害，助长了物质主义文化，削弱了真正的人类福祉。',
    words: 'dominant,cultural,identity,excessive,sustainable,detrimental,genuine',
    difficulty: 3
  },
  {
    title: '远程工作的兴起',
    passage_en: 'The pandemic has dramatically accelerated the shift toward remote work, a trend that appears likely to persist. While employees enjoy greater flexibility and work-life balance, managers face challenges in maintaining team cohesion and corporate culture. Organizations must adapt their management practices to this new reality.',
    passage_cn: '疫情极大地加速了向远程工作的转变，这一趋势似乎很可能会持续下去。虽然员工享有更大的灵活性和工作生活平衡，但管理者在维持团队凝聚力和企业文化方面面临挑战。组织必须调整其管理实践以适应这一新现实。',
    words: 'dramatic,accelerate,shift,trend,persistent,adapt,maintain',
    difficulty: 2
  },
  {
    title: '人工智能伦理',
    passage_en: 'The rapid development of artificial intelligence raises profound ethical questions that society must address. Issues such as algorithmic bias, privacy protection, and the potential displacement of human workers require careful consideration. Policymakers face the challenge of regulating AI technology without stifling innovation.',
    passage_cn: '人工智能的快速发展提出了社会必须解决的深刻伦理问题。算法偏见、隐私保护和人类劳动者可能被取代等问题需要认真考虑。政策制定者面临着规范人工智能技术而不扼杀创新的挑战。',
    words: 'artificial,profound,ethical,potential,bias,privacy,regulate,innovation',
    difficulty: 3
  },
  {
    title: '老龄化社会',
    passage_en: 'Many developed countries are confronting the challenges of an aging population. The declining birth rate and increasing life expectancy have strained pension systems and healthcare resources. Governments are exploring various strategies, from raising the retirement age to encouraging immigration, in an attempt to mitigate the economic impact.',
    passage_cn: '许多发达国家正面临人口老龄化的挑战。出生率下降和预期寿命延长给养老金体系和医疗资源带来了压力。各国政府正在探索各种策略，从提高退休年龄到鼓励移民，试图减轻经济影响。',
    words: 'confront,decline,increase,strain,resource,strategy,attempt,mitigate',
    difficulty: 3
  },
  {
    title: '社交媒体与心理健康',
    passage_en: 'The relationship between social media usage and mental health has attracted significant research attention. Studies have found a correlation between excessive social media consumption and increased rates of anxiety and depression among young people. However, researchers caution that the relationship is complex, and social media can also provide valuable social support.',
    passage_cn: '社交媒体使用与心理健康之间的关系吸引了大量的研究关注。研究发现过度使用社交媒体与年轻人焦虑和抑郁率上升之间存在关联。然而，研究人员提醒说，这种关系是复杂的，社交媒体也可以提供宝贵的社交支持。',
    words: 'significant,research,correlation,excessive,anxiety,depression,cautious,complex',
    difficulty: 3
  },
  {
    title: '基因编辑技术',
    passage_en: 'Gene editing technology, particularly CRISPR, has revolutionized biomedical research and opened up unprecedented possibilities for treating genetic diseases. Nevertheless, the technology raises profound ethical concerns about the potential for creating genetically modified humans. Scientists and policymakers must collaborate to establish appropriate guidelines.',
    passage_cn: '基因编辑技术，特别是CRISPR，彻底改变了生物医学研究，为治疗遗传疾病开辟了前所未有的可能性。然而，这项技术引发了关于创造转基因人类可能性的深刻伦理关切。科学家和政策制定者必须合作制定适当的指导方针。',
    words: 'technology,unprecedented,treat,nevertheless,ethical,potential,appropriate,collaborate',
    difficulty: 4
  },
  {
    title: '城市交通拥堵',
    passage_en: 'Traffic congestion has become a severe problem in major cities worldwide, leading to lost productivity and environmental pollution. Many cities have implemented measures such as congestion pricing, improved public transit, and cycling infrastructure to alleviate the problem. However, the fundamental solution lies in comprehensive urban planning.',
    passage_cn: '交通拥堵已成为全球主要城市的严重问题，导致生产力损失和环境污染。许多城市已经实施了拥堵收费、改善公共交通和自行车基础设施等措施来缓解问题。然而，根本的解决方案在于全面的城市规划。',
    words: 'severe,implement,measure,infrastructure,alleviate,fundamental,comprehensive,urban',
    difficulty: 2
  },
  {
    title: '太空探索的意义',
    passage_en: 'Space exploration continues to capture human imagination and drive technological innovation. Proponents argue that the benefits of space research extend far beyond scientific knowledge, producing practical applications that improve daily life. Critics, however, contend that the enormous cost could be better spent on addressing terrestrial problems.',
    passage_cn: '太空探索继续激发人类的想象力并推动技术创新。支持者认为太空研究的益处远远超出科学知识本身，还能产生改善日常生活的实际应用。然而，批评者认为巨额资金本可以更好地用于解决地球上的问题。',
    words: 'exploration,capture,innovation,benefit,extend,application,enormous,contend',
    difficulty: 3
  },
  {
    title: '大数据与隐私',
    passage_en: 'The era of big data has brought remarkable advances in fields ranging from healthcare to marketing. The ability to analyze vast amounts of information enables more personalized services and better decision-making. Yet the collection and utilization of personal data raise serious concerns about privacy and the potential for abuse.',
    passage_cn: '大数据时代给从医疗到营销等领域带来了显著的进步。分析海量信息的能力使得更加个性化的服务和更好的决策成为可能。然而，个人数据的收集和利用引发了关于隐私和滥用可能性的严重关切。',
    words: 'remarkable,range,enable,analyze,potential,concern,privacy,abuse',
    difficulty: 2
  },
];

async function seedExtra() {
  await initDb();

  // Add extra words
  const existing = get('SELECT COUNT(*) as c FROM words').c;
  let addedWords = 0;
  for (const w of extraWords) {
    const dup = get('SELECT id FROM words WHERE word = ?', [w.w]);
    if (!dup) {
      run('INSERT INTO words (word, phonetic, pos, definition_cn, definition_en, frequency, difficulty, sentence_en, sentence_cn) VALUES (?,?,?,?,?,?,?,?,?)',
        [w.w, w.ph, w.pos, w.cn, w.en, w.f, w.d, w.se, w.sc]);
      addedWords++;
    }
  }
  console.log('新增词汇: ' + addedWords + ' 个');

  // Add passages
  const existingPassages = get('SELECT COUNT(*) as c FROM passages').c;
  if (existingPassages > 0) {
    console.log('段落已有 ' + existingPassages + ' 个，跳过导入。');
  } else {
    for (const p of passages) {
      run('INSERT INTO passages (title, passage_en, passage_cn, word_ids, difficulty) VALUES (?,?,?,?,?)',
        [p.title, p.passage_en, p.passage_cn, p.words, p.difficulty]);
    }
    console.log('导入段落: ' + passages.length + ' 篇');
  }

  console.log('✅ 补充数据完成！总词汇: ' + (existing + addedWords) + '，段落: ' + (existingPassages > 0 ? existingPassages : passages.length));
}

module.exports = { words: extraWords, passages };

if (require.main === module) {
  seedExtra().catch(err => { console.error('失败:', err); process.exit(1); });
}
