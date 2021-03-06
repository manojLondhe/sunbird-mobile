import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Events } from 'ionic-angular';
import {
    AuthService,
    FrameworkService,
    CategoryRequest,
    FrameworkDetailsRequest,
    Impression,
    ImpressionType,
    Environment,
    TelemetryService,
    ProfileService,
    Profile
} from 'sunbird';

@Injectable()
export class OnboardingService {
    userId: string;
    profile: any = {};
    onBoardingSlides: any[];
    isOnBoardingCardCompleted: boolean = false;
    currentIndex: number = 0;

    categories: Array<any> = [];
    boardList: Array<string> = [];
    gradeList: Array<string> = [];
    subjectList: Array<string> = [];
    mediumList: Array<string> = [];

    constructor(
        private authService: AuthService,
        private framework: FrameworkService,
        private telemetryService: TelemetryService,
        private profileService: ProfileService,
        public events: Events
    ) { }
    initializeCard() {
        this.getFrameworkDetails();

        this.onBoardingSlides = [
            {
                'id': 'boardList',
                'title': 'BOARD_QUESTION',
                'desc': 'BOARD_OPTION_TEXT',
                'options': [],
                'selectedOptions': '',
                'selectedCode': []
            },
            {
                'id': 'gradeList',
                'title': 'GRADE_QUESTION',
                'desc': 'GRADE_OPTION_TEXT',
                'options': [],
                'selectedOptions': '',
                'selectedCode': []
            },
            {
                'id': 'subjectList',
                'title': 'SUBJECT_QUESTION',
                'desc': 'SUBJECT_OPTION_TEXT',
                'options': [],
                'selectedOptions': '',
                'selectedCode': []
            },
            {
                'id': 'mediumList',
                'title': 'MEDIUM_QUESTION',
                'desc': 'MEDIUM_OPTION_TEXT',
                'options': [],
                'selectedOptions': '',
                'selectedCode': []
            }
        ]


        this.onBoardingSlides[0].options = this.boardList;
        this.onBoardingSlides[1].options = this.gradeList;
        this.onBoardingSlides[2].options = this.subjectList;
        this.onBoardingSlides[3].options = this.mediumList;

        return this.getCurrentUser();
    }

    /**
     * Method user to fetch Current Guest User
     */
    getCurrentUser(): void {
        this.profileService.getCurrentUser((res: any) => {
            this.profile = JSON.parse(res);
            this.currentIndex = 0;
            if (this.profile.board && this.profile.board[0] !== '') { this.onBoardingSlides[0].selectedOptions = this.profile.board; this.currentIndex = 25; }
            if (this.profile.grade && this.profile.grade[0] !== '') { this.onBoardingSlides[1].selectedOptions = this.profile.grade; this.currentIndex = 50; }
            if (this.profile.subject && this.profile.subject[0] !== '') { this.onBoardingSlides[2].selectedOptions = this.profile.subject; this.currentIndex = 75; }
            if (this.profile.medium && this.profile.medium[0] !== '') { this.onBoardingSlides[3].selectedOptions = this.profile.medium; this.currentIndex = 100; }
        },
            (err: any) => {
                console.log("Err1", err);
            });
    }

    /**
     * It fetches all the categories using Framework API
     */
    getFrameworkDetails(): void {
        let req: FrameworkDetailsRequest = {
            defaultFrameworkDetails: true
        };

        this.framework.getFrameworkDetails(req,
            (res: any) => {
                this.categories = JSON.parse(JSON.parse(res).result.framework).categories;
                console.log("Framework details Response: ", JSON.parse(JSON.parse(res).result.framework).categories);
            },
            (err: any) => {
                console.log("Framework details Response: ", JSON.parse(err));
            });
    }

    /**
     * This will internally call framework API to get latest list of item, wont call API if list is already present locally
     * @param {string} currentCategory - request Parameter passing to the framework API
     * @param {string} list - Local variable name to hold the list data
     */
    getCategoryData(req: CategoryRequest, list): void {

        //if (!this[list].length) {
        this.framework.getCategoryData(req,
            (res: any) => {
                // { text: 'Lang1', value: 'Lang1', checked: true }
                const resposneArray = JSON.parse(res);
                this[list] = [];
                let value = {};
                resposneArray.forEach(element => {
                    if (list === "boardList" && this.profile.board && this.profile.board.length && this.profile.board.indexOf(element.code) > -1) {
                        this.onBoardingSlides[0].selectedCode.push(element.code);
                        value = { 'text': element.name, 'value': element.code, 'checked': true };
                    } else if (list === "gradeList" && this.profile.grade && this.profile.grade.length && this.profile.grade.indexOf(element.code) > -1) {
                        this.onBoardingSlides[1].selectedCode.push(element.code);
                        value = { 'text': element.name, 'value': element.code, 'checked': true };
                    } else if (list === "subjectList" && this.profile.subject && this.profile.subject.length && this.profile.subject.indexOf(element.code) > -1) {
                        this.onBoardingSlides[2].selectedCode.push(element.code);
                        value = { 'text': element.name, 'value': element.code, 'checked': true };
                    } else if (list === "mediumList" && this.profile.medium && this.profile.medium.length && this.profile.medium.indexOf(element.code) > -1) {
                        this.onBoardingSlides[3].selectedCode.push(element.code);
                        value = { 'text': element.name, 'value': element.code, 'checked': true };
                    } else {
                        value = { 'text': element.name, 'value': element.code, 'checked': false };
                    }

                    this[list].push(value)
                });

                this.getListArray(list);
                console.log(list + " Category Response: " + this[list]);
            },
            (err: any) => {
                console.log("Subject Category Response: ", err);
            });
        //}
    }

    /**
     * It checks whether Previous Field is filled or not
     * @param {number} index
     * @param {any}    currentField
     * @param {string} prevSelectedValue
     */
    checkPrevValue(index: number = 0, currentField, prevSelectedValue = []) {

        if (index != 0) {
            let request: CategoryRequest = {
                currentCategory: this.categories[index].code,
                prevCategory: this.categories[index - 1].code,
                selectedCode: prevSelectedValue
            }
            this.getCategoryData(request, currentField);
        } else {
            let request: CategoryRequest = {
                currentCategory: this.categories[index].code
            }
            this.getCategoryData(request, currentField);
        }
    }

    /**
     * It returns list name by ID
     * @param   {number} index
     * @returns {string} Listname
     */
    getListName(index: number): string {
        if (index == 0) {
            return 'boardList';
        } else if (index == 1) {
            return 'gradeList';
        } else if (index == 2) {
            return 'subjectList';
        } else if (index == 3) {
            return 'mediumList';
        } else {
            return 'boardList';
        }
    }

    /**
     * Assign latest list data to local variables
     * @param {string} name name of the local variable
     */
    getListArray(name: string): void {
        if (name == 'boardList') {
            this.onBoardingSlides[0].options = this.boardList;
        } else if (name == 'gradeList') {
            this.onBoardingSlides[1].options = this.gradeList;
        } else if (name == 'subjectList') {
            this.onBoardingSlides[2].options = this.subjectList;
        } else if (name == 'mediumList') {
            this.onBoardingSlides[3].options = this.mediumList;
        }
    }

    /**
     * This will makes an API call for the current category
     */
    saveDetails(index: number): void {
        let req: Profile = {
            age: -1,
            day: -1,
            month: -1,
            standard: -1,
            board: (_.find(this.onBoardingSlides, ['id', 'boardList']).selectedCode.length) ? _.find(this.onBoardingSlides, ['id', 'boardList']).selectedCode : this.profile.board,
            grade: (_.find(this.onBoardingSlides, ['id', 'gradeList']).selectedCode.length) ? _.find(this.onBoardingSlides, ['id', 'gradeList']).selectedCode : this.profile.grade,
            subject: (_.find(this.onBoardingSlides, ['id', 'subjectList']).selectedCode.length) ? _.find(this.onBoardingSlides, ['id', 'subjectList']).selectedCode : this.profile.subject,
            medium: (_.find(this.onBoardingSlides, ['id', 'mediumList']).selectedCode.length) ? _.find(this.onBoardingSlides, ['id', 'mediumList']).selectedCode : this.profile.medium,
            uid: this.profile.uid,
            handle: this.profile.handle,
            isGroupUser: false,
            language: "en",
            avatar: "avatar",
            createdAt: this.profile.createdAt
        }
        if(index === 0 && !_.find(this.onBoardingSlides, ['id', 'boardList']).selectedCode.length) {
            req.board = [];
        }
        if(index === 1 && !_.find(this.onBoardingSlides, ['id', 'gradeList']).selectedCode.length) {
            req.grade = [];
        }
        if(index === 2 && !_.find(this.onBoardingSlides, ['id', 'subjectList']).selectedCode.length) {
            req.subject = [];
        }
        if(index === 3 && !_.find(this.onBoardingSlides, ['id', 'mediumList']).selectedCode.length) {
            req.medium = [];
        }
        this.profileService.updateProfile(req,
            (res: any) => {
                if (this.onBoardingSlides.length === (index + 1)) {
                    this.isOnBoardingCardCompleted = true;
                    this.events.publish('onboarding-card:completed', { isOnBoardingCardCompleted: this.isOnBoardingCardCompleted });
                } else {
                    this.isOnBoardingCardCompleted = false;
                    this.events.publish('onboarding-card:completed', { isOnBoardingCardCompleted: this.isOnBoardingCardCompleted });
                }
                this.currentIndex = index + 1;
                this.events.publish('refresh:profile');

                this.getCurrentUser();
            },
            (err: any) => {
                console.log("Err", err);
            });
    }
}