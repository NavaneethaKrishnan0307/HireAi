import urllib.request
import json
import sys

def test_api():
    print('=' * 65)
    print('         HIREAI FULL-STACK LIVE END-TO-END VERIFICATION')
    print('=' * 65)
    
    # 1. Health check
    try:
        req = urllib.request.urlopen('http://127.0.0.1:8000/api/health')
        health = json.loads(req.read().decode())
        print('[OK] 1. Backend Health Check: Status = OK (Service = ' + health.get('service', '') + ')')
    except Exception as e:
        print('[FAIL] Backend not responding on port 8000:', e)
        return False
    
    # 2. Candidate Login
    login_data = json.dumps({'email': 'candidate@demo.com', 'password': 'password123', 'role': 'candidate'}).encode()
    req = urllib.request.Request('http://127.0.0.1:8000/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
    res = json.loads(urllib.request.urlopen(req).read().decode())
    token = res['token']
    print('[OK] 2. Candidate Login Successful. Token: ' + token[:25] + '...')
    
    # 3. Candidate Jobs & Skill Gap Advisor Check
    req = urllib.request.Request('http://127.0.0.1:8000/api/candidate/jobs', headers={'Authorization': f'Bearer {token}'})
    jobs = json.loads(urllib.request.urlopen(req).read().decode())
    print('[OK] 3. Candidate Jobs Retrieved: ' + str(len(jobs)) + ' active opportunities.')
    for j in jobs:
        print('   -> Job: "' + j["title"] + '" | Match: ' + str(j["match_score"]) + '%')
        if j.get('skill_gap_advice') and len(j['skill_gap_advice']) > 0:
            print('      [Skill Gap Advice]: ' + j["skill_gap_advice"][0]["recommendation"])
            
    # 4. HR Login
    hr_data = json.dumps({'email': 'hr@techcorp.com', 'password': 'password123', 'role': 'hr'}).encode()
    req = urllib.request.Request('http://127.0.0.1:8000/api/auth/login', data=hr_data, headers={'Content-Type': 'application/json'})
    hr_res = json.loads(urllib.request.urlopen(req).read().decode())
    hr_token = hr_res['token']
    print('[OK] 4. HR Recruiter Login Successful. Token: ' + hr_token[:25] + '...')
    
    # 5. HR Candidate Matches with Dynamic Weights
    job_id = '55555555-5555-5555-5555-555555555551'
    req = urllib.request.Request(f'http://127.0.0.1:8000/api/hr/jobs/{job_id}/applicants?weight_skills=0.70&weight_experience=0.20', headers={'Authorization': f'Bearer {hr_token}'})
    applicants = json.loads(urllib.request.urlopen(req).read().decode())
    print('[OK] 5. HR Dynamic Weights Ranking: ' + str(len(applicants)) + ' applicants evaluated.')
    for a in applicants:
        print('   -> Candidate: ' + a["full_name"] + ' | Overall: ' + str(a["match_score"]) + '% | Skill Score: ' + str(a["match_details"]["skill_score"]) + '%')
        
    # 6. CSV Export Check
    req = urllib.request.Request(f'http://127.0.0.1:8000/api/hr/jobs/{job_id}/export-csv', headers={'Authorization': f'Bearer {hr_token}'})
    csv_content = urllib.request.urlopen(req).read().decode()
    lines = csv_content.strip().splitlines()
    print('[OK] 6. CSV Leaderboard Export Verified (' + str(len(csv_content)) + ' bytes generated).')
    print('   -> CSV Header : ' + lines[0])
    if len(lines) > 1:
        print('   -> CSV Row #1 : ' + lines[1])
    
    print('=' * 65)
    print('      ALL 6 CORE RECRUITMENT ENGINES 100% OPERATIONAL!')
    print('=' * 65)
    return True

if __name__ == "__main__":
    test_api()
