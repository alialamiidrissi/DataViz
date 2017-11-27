import * as c3 from 'c3';

export function add_faculty(x) {
    let section_map = {
        "Microengineering": "STI",
        "Materials Science and Engineering": "STI",
        "Chemical Engineering and Biotechnology": "STI",
        "Electrical and Electronics Engineering": "STI",
        "Architecture": "ENAC",
        "Computer Science": "IC",
        "Civil Engineering": "ENAC",
        "Communication Systems": "IC",
        "Environmental Sciences and Engineering": "ENAC",
        "Energy Management and Sustainability": "ENAC",
        "Mathematics for teaching": "SB",
        "Financial engineering": "CDM",
        "Physics": "SB",
        "Mathematics": "SB",
        "Computational science and Engineering": "STI",
        "Molecular & Biological Chemistry": "SV",
        "Mechanical Engineering": "STI",
        "Applied Mathematics": "SB",
        "Management": "CDM",
        "Bioengineering": "SV",
        "Life Sciences and Technologies": "STI",
        "Applied Physics": "SB",
        "Chemistry and Chemical Engineering": "SB",
        "Nuclear engineering": "STI",
        "Micro and Nanotechnologies for Integrated Systems": "STI",
        "Passerelle HES": "Other",
        "CMS": "Other",
        "Data Science":"IC",
        "Digital Humanities":"CDH",
        "Chemistry teaching": "SB"
    }
    x['faculty'] = section_map[x['section']]
    return x
}
