/**
 * @author wei.chen19.o
 */
Vue.component('autoComplete', {
    template: `
        <div class="wf-auto-complete" :class="{
            'wf-auto-complete-clearable':clearBtnShow
        }" @mouseenter="clearShow=true" @mouseleave="clearShow=false">
            <!-- 搜索输入 -->
            <input v-if="resultShow" type="text" v-model="filterInputValue"
                ref="filterInput"
                :placeholder="label"
                autocomplete="off"
                @keydown="filterInputKeydown"/>
            <!-- 选取的内容的 label -->
            <input v-else type="text" class="wf-auto-complete-label" v-model="label"
                ref="labelInput"
                :class="labelClasses"
                readonly
                :disabled="disabled"
                :title="label||placeholder"
                :placeholder="placeholder||'Please Select'"
                @focus="start"
                @click="start"
                @keydown="filterInputKeydown"/>
            <!-- 选取的内容的 value -->
            <input v-show="false" type="text" v-model="value" readonly/>
            <!-- clear -->
            <i v-if="clearBtnShow"
                class="wf-auto-complete-clear"
                @click="clear"
                title="clear"
            >×</i>
            <!-- 选项下拉按钮 -->
            <i class="wf-auto-complete-arrow" @click="start"></i>
            <!-- 过滤项 -->
            <div v-if="showStatistic?resultShow:(resultShow && filteredData.length)"
                class="wf-auto-complete-result"
                :style="resultStyle">
                <ul ref="filteredBox">
                    <li v-for="(item,i) in filteredVisibleData"
                        :key="[item[valueKey],i].join('_')"
                        :class="{
                            'wf-auto-complete-result-item-selected':item[valueKey]===value,
                            'wf-auto-complete-result-item-pointer':i===pointIndex
                        }"
                        :data-value="item[valueKey]"
                        @mouseenter="pointIndex=i"
                        @click="confirmed(item)">
                        {{item[labelKey]}}
                    </li>
                </ul>
                <template v-if="showStatistic">
                    <div v-if="!data.length" class="wf-auto-complete-result-total">
                        No item
                    </div>
                    <div v-else-if="data.length>resultMaxLength" class="wf-auto-complete-result-total">
                        Total items:{{data.length}}
                        <template v-if="resultMaxLength">
                            <br/>Maximum displayed: {{resultMaxLength}}
                        </template>
                    </div>
                </template>
            </div>
        </div>
    `,
    model:{
        prop:'value',
        event:'change'
    },
    props: {
        value: {
            default: null
        },
        data:{
            type:Array,
            default:[]
        },
        labelKey:{
            type:String,
            default:'label'
        },
        valueKey:{
            type:String,
            default:'value'
        },
        filterKey:{
            type:[String,Array],
            default:'both' // label|value|both|Array(字段名集合)
        },
        resultMaxLength:{
            type:Number,
            default:0
        },
        disabled:{
            type:Boolean,
            default:false
        },
        readonly:{
            type:Boolean,
            default:false
        },
        clearable:{
            type:Boolean,
            default:true
        },
        ignoreCase:{
            type:Boolean,
            default:true
        },
        showStatistic:{
            type:Boolean,
            default:false
        },
        placeholder:{
            type:String,
            default:'Please Select'
        },
        labelClass:{
            type:[String,Array],
            default:''
        },
        resultStyle:{
            type:[String,Object],
            default:()=>({
                'min-width':'200px'
            })
        },
        required:{
            type:Boolean,
            default:false
        }
    },
    data() {
        return {
            resultShow:false,
            filterInputValue:'',
            clearShow:false,
            pointIndex:null
        };
    },
    computed:{
        // 筛选出的数据
        filteredData(){
            return this.data.filter(item=>{
                let matchingValue=item[this.labelKey]
                let flags=['g']
                let expr=`${this.filterInputValue||'.'}+`

                if(this.filterKey instanceof Array){
                    matchingValue=this.filterKey.map(key=>item[key]).join(' ')
                }else{
                    switch(this.filterKey){
                        case 'label':
                            matchingValue=item[this.labelKey]
                            break;
                        case 'value':
                            matchingValue=item[this.valueKey]
                            break;
                        case 'both':
                            matchingValue=[item[this.labelKey],item[this.valueKey]].join(' ')
                            break;
                    }
                }

                if(this.ignoreCase){
                    flags.push('i')
                }

                return !item.hidden&&new RegExp(expr,flags.join('')).test(matchingValue)
            })
        },
        // 最终展示的筛选数据
        filteredVisibleData(){
            return this.filteredData.filter((item,i)=>{
                return this.resultMaxLength?i<this.resultMaxLength:true
            })
        },
        label(){
            let matched=this.data.find(item=>item[this.valueKey]===this.value)
            return matched?matched[this.labelKey]:''
        },
        labelClasses(){
            let classes={}
            if(typeof this.labelClass==='string'){
                this.labelClass.split(' ').forEach(item => {
                    classes[item]=true
                });
            }else if(this.labelClass instanceof Array){
                this.labelClass.forEach(item => {
                    classes[item]=true
                });
            }
            return {
                ...classes,
                'validate[required]':this.required
            }
        },
        clearBtnShow(){
            return this.clearable&&!this.disabled&&!this.readonly&&this.clearShow&&!this.resultShow&&this.value
        }
    },
    mounted() {

    },
    watch: {
        resultShow(show){
            if(show){
                window.addEventListener('mouseup',this.globalClickEvent)
            }else{
                window.removeEventListener('mouseup',this.globalClickEvent)
            }
        }
        // data(data){
        //     let matched=data.find(item=>item[this.valueKey]===this.value)
        //     if(!matched){
        //         this.clear()
        //     }
        // }
    },
    methods: {
        pointing(type){
            if(this.resultShow&&this.pointIndex!==null&&this.$refs.filteredBox){
                let itemDom=this.$refs.filteredBox.querySelectorAll('li')[this.pointIndex]
                let boxHeight=this.$refs.filteredBox.offsetHeight
                let itemPositionX=itemDom.offsetTop+itemDom.offsetHeight
                // console.log('pointing',this.pointIndex,boxHeight,[this.$refs.filteredBox.scrollTop,itemPositionX],[itemDom.offsetTop,this.$refs.filteredBox.scrollTop])
                if((itemPositionX-(boxHeight+this.$refs.filteredBox.scrollTop))>0){ // 下边界
                    let y=(itemPositionX-boxHeight)||0
                    // console.log('pointing',y)
                    this.$refs.filteredBox.scrollTo(0,y)
                }else if((itemDom.offsetTop-this.$refs.filteredBox.scrollTop)<0){ // 上边界
                    let y=itemDom.offsetTop||0
                    // console.warn('pointing',[itemDom.offsetTop,this.$refs.filteredBox.scrollTop],y)
                    this.$refs.filteredBox.scrollTo(0,y)
                }
            }
        },
        globalClickEvent(event){
            // console.log(event.target,this.$el.contains(event.target))
            if(!this.$el.contains(event.target)){
                this.end()
            }
        },
        filterInputKeydown(event){
            // console.log('filterInputKeydown',event.keyCode)
            if(this.resultShow){
                switch(event.keyCode){
                    case 9: // tab
                        this.end()
                        break;
                    case 27: // esc
                        this.end()
                        break;
                    case 38: // up
                        if(this.pointIndex===null){
                            this.pointIndex=0
                        }else if(this.pointIndex>0){
                            this.pointIndex-=1
                        }else{
                            this.pointIndex=this.filteredVisibleData.length-1
                        }
                        this.pointing('up')
                        break;
                    case 40: // down
                        if(this.pointIndex===null){
                            this.pointIndex=0
                        }else if(this.pointIndex<(this.filteredVisibleData.length-1)){
                            this.pointIndex+=1
                        }else{
                            this.pointIndex=0
                        }
                        this.pointing('down')
                        break;
                    case 13: // enter
                        this.confirmed(this.filteredVisibleData[this.pointIndex])
                        break;
                    default:
                }
            }else{
                if(![9,27].includes(event.keyCode)){
                    this.start()
                }
            }
        },
        start(){
            if(this.disabled||this.readonly){
                return
            }
            this.resultShow=true
            this.pointIndex=null
            this.$nextTick(()=>{
                this.clearShow=false
                this.$refs.filterInput.focus()
            })
        },
        end(){
            this.filterInputValue=''
            this.resultShow=false
            // this.$nextTick(()=>{
            //     this.$refs.labelInput.blur()
            // })
        },
        confirmed(item){
            console.log('autocomplete confirmed',item,item[this.valueKey])
            if(item){
                this.filterInputValue=item[this.labelKey]
                this.$emit('change',item[this.valueKey],item)
                this.end()
                this.clearShow=false
            }
        },
        clear(){
            this.$emit('change','')
            this.end()
        }
    }
});
