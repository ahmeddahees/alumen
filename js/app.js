/**
 * Aluminum Kitchen Application Controller
 * إدارة شاسيه المطابخ، التقسيم التلقائي الذكي، نظام المطبقيه للعلب العلوية، والأرفف والدرف
 */

document.addEventListener("DOMContentLoaded", () => {
    // --- Application State ---
    let state = {
        chassisStockLength: 600, // طول عود الشاسيه (6.0 متر)
        doorStockLength: 600,    // طول عود قطاع الضلفة (6.0 متر)
        bladeKerf: 0.4,          // 4 مم
        profileDeduction: 2.5,   // خصم التجميع الافتراضي (2.5 سم)
        clientName: "",
        units: []
    };
    const drawerStockLength = 600;

    // --- DOM Elements ---
    const unitsContainer = document.getElementById("unitsContainer");
    const unitsCountBadge = document.getElementById("unitsCountBadge");
    const addUnitBtn = document.getElementById("addUnitBtn");
    const clearAllUnitsBtn = document.getElementById("clearAllUnitsBtn");
    
    // Settings Elements
    const chassisStockPills = document.querySelectorAll("#chassisStockSelector .pill-btn");
    const customChassisBox = document.getElementById("customChassisBox");
    const customChassisInput = document.getElementById("customChassisInput");

    const doorStockPills = document.querySelectorAll("#doorStockSelector .pill-btn");
    const customDoorBox = document.getElementById("customDoorBox");
    const customDoorInput = document.getElementById("customDoorInput");

    const bladeKerfInput = document.getElementById("bladeKerfInput");
    const profileDeductionInput = document.getElementById("profileDeductionInput");
    const clientNameInput = document.getElementById("clientNameInput");
    
    // Summary Displays
    const chassisBarsDisplay = document.getElementById("chassisBarsDisplay");
    const chassisStockSub = document.getElementById("chassisStockSub");
    const doorBarsDisplay = document.getElementById("doorBarsDisplay");
    const doorStockSub = document.getElementById("doorStockSub");
    const totalUsedMetersDisplay = document.getElementById("totalUsedMetersDisplay");
    const chassisMetersSub = document.getElementById("chassisMetersSub");
    const doorMetersSub = document.getElementById("doorMetersSub");
    const efficiencyDisplay = document.getElementById("efficiencyDisplay");
    const chassisWasteSub = document.getElementById("chassisWasteSub");
    const doorWasteSub = document.getElementById("doorWasteSub");
    const drawerBarsDisplay = document.getElementById("drawerBarsDisplay");
    const drawerStockSub = document.getElementById("drawerStockSub");
    const drawerMetersSub = document.getElementById("drawerMetersSub");
    const drawerWasteSub = document.getElementById("drawerWasteSub");

    // Badges in Tabs
    const chassisBarsTabBadge = document.getElementById("chassisBarsTabBadge");
    const doorBarsTabBadge = document.getElementById("doorBarsTabBadge");
    const drawerBarsTabBadge = document.getElementById("drawerBarsTabBadge");
    
    // Results Displays
    const chassisBarsListContainer = document.getElementById("chassisBarsListContainer");
    const doorsBarsListContainer = document.getElementById("doorsBarsListContainer");
    const drawerBarsListContainer = document.getElementById("drawerBarsListContainer");
    const cuttingTableBody = document.getElementById("cuttingTableBody");
    const toast = document.getElementById("toast");
    
    // Tabs
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    // Print Elements
    const printJobBtn = document.getElementById("printJobBtn");
    const saveProjectBtn = document.getElementById("saveProjectBtn");

    // Calculation Action Elements (أوبشن احسب عدد الأعواد)
    const calculateAllBtn = document.getElementById("calculateAllBtn");
    const headerCalculateBtn = document.getElementById("headerCalculateBtn");
    const mobileCalculateBtn = document.getElementById("mobileCalculateBtn");
    const mobileAddUnitBtn = document.getElementById("mobileAddUnitBtn");
    const mobileUnitsCountBadge = document.getElementById("mobileUnitsCountBadge");
    const calcActionBanner = document.getElementById("calcActionBanner");
    const calcUnitsCountBadge = document.getElementById("calcUnitsCountBadge");
    const calcStatusIndicator = document.getElementById("calcStatusIndicator");
    const calcStatusText = document.getElementById("calcStatusText");

    let calculationPending = false;

    function updateCalcUnitsBadge() {
        const count = state.units ? state.units.length : 0;
        if (calcUnitsCountBadge) {
            calcUnitsCountBadge.textContent = `${count} علبة`;
        }
        if (mobileUnitsCountBadge) {
            mobileUnitsCountBadge.textContent = `${count}`;
        }
    }

    function markCalculationPending(message) {
        calculationPending = true;
        updateCalcUnitsBadge();
        if (calcStatusIndicator) calcStatusIndicator.classList.add("pending");
        if (calcStatusText) calcStatusText.textContent = message || "توجد تعديلات - اضغط احسب لتحديث النتائج";
        if (calcActionBanner) calcActionBanner.classList.add("needs-calc");
        if (headerCalculateBtn) headerCalculateBtn.classList.add("needs-calc");
        if (mobileCalculateBtn) mobileCalculateBtn.classList.add("needs-calc");
    }

    function markCalculationFresh() {
        calculationPending = false;
        updateCalcUnitsBadge();
        if (calcStatusIndicator) calcStatusIndicator.classList.remove("pending");
        if (calcStatusText) calcStatusText.textContent = "تم الحساب بنجاح ✓";
        if (calcActionBanner) calcActionBanner.classList.remove("needs-calc");
        if (headerCalculateBtn) headerCalculateBtn.classList.remove("needs-calc");
        if (mobileCalculateBtn) mobileCalculateBtn.classList.remove("needs-calc");
    }

    function doCalculateAll(scroll = true) {
        if (!state.units || state.units.length === 0) {
            showToast("⚠️ الرجاء إضافة علبة واحدة على الأقل أولاً");
            return;
        }
        const invalidDrawerUnit = state.units.find(unit =>
            unit.unitType !== "upper" &&
            unit.hasDrawers &&
            (!Number.isFinite(parseFloat(unit.drawerOpeningWidth)) || parseFloat(unit.drawerOpeningWidth) < 2.6)
        );
        if (invalidDrawerUnit) {
            showToast(`⚠️ أدخل عرض فتحة الأدراج في: ${invalidDrawerUnit.name}`);
            return;
        }
        recalculateAll();
        markCalculationFresh();
        showToast("✓ تم حساب عدد الأعواد ومخطط التقطيع بنجاح!");
        if (scroll) {
            const resSec = document.getElementById("resultsSection");
            if (resSec) {
                resSec.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    }

    if (calculateAllBtn) {
        calculateAllBtn.addEventListener("click", () => doCalculateAll(true));
    }
    if (headerCalculateBtn) {
        headerCalculateBtn.addEventListener("click", () => doCalculateAll(true));
    }
    if (mobileCalculateBtn) {
        mobileCalculateBtn.addEventListener("click", () => doCalculateAll(true));
    }
    if (mobileAddUnitBtn) {
        mobileAddUnitBtn.addEventListener("click", () => {
            if (addUnitBtn) addUnitBtn.click();
        });
    }

    function showToast(message, duration = 3000) {
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), duration);
    }

    // --- Local Storage Management ---
    function loadSavedState() {
        const saved = localStorage.getItem("aluminum_craftsman_state_v6") || localStorage.getItem("aluminum_craftsman_state_v5");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                state = { ...state, ...parsed };
            } catch (e) {}
        }

        if (!state.units || state.units.length === 0) {
            // العينة 1: علبة 200 سم علوية بمطبقية 70 سم
            const unit1 = {
                id: "u_" + Date.now() + "_1",
                name: "علبة علوية 200سم بمطبقية 70سم (مثال المعلم)",
                unitType: "upper",          // وحدة فوق (علوي)
                hasDishRack: true,          // يوجد مطبقية
                dishRackSize: 70,           // مقاس المطبقية 70 سم (الصافي 67 سم)
                dishRackRemainMode: "third_twothirds", // الباقي ثلث وثلثين
                width: 200,
                height: 80,
                depth: 35,
                partitions: 2,              // فاصلين
                shelfTiers: 1,
                handleType: "external",     // مقبض خارجي (+3 سم)
                autoDoorSplit45: false,
                quantity: 1
            };
            autoCalculateUnitDivisions(unit1);

            // العينة 2: علبة سفلية 100 سم بفاصل رأسي يدوي (1 فاصل)
            const unit2 = {
                id: "u_" + Date.now() + "_2",
                name: "علبة سفلية 100سم بفاصل رأسي",
                unitType: "lower",          // وحدة تحت (سفلي)
                hasDishRack: false,
                width: 100,
                height: 85,
                depth: 60,
                partitions: 1,              // فاصل يدوي 1
                shelfTiers: 1,
                handleType: "external",
                autoDoorSplit45: false,
                quantity: 1
            };
            autoCalculateUnitDivisions(unit2);

            state.units = [unit1, unit2];
        } else {
            state.units.forEach(u => {
                if (u.autoDoorSplit45 !== false) {
                    u.autoDoorSplit45 = false;
                    (u.doorsList || []).forEach(door => {
                        if (door.sectionKey) delete door.customSplitMode;
                    });
                }
                if (u.partitions === undefined || u.partitions === null) {
                    if (u.divisionMode === "2" || u.divisionMode === "1/3_2/3") u.partitions = 1;
                    else if (u.divisionMode === "3") u.partitions = 2;
                    else if (u.divisionMode === "4") u.partitions = 3;
                    else u.partitions = 0;
                }
                delete u.divisionMode;
                autoCalculateUnitDivisions(u);
            });
        }

        bladeKerfInput.value = state.bladeKerf || 0.4;
        profileDeductionInput.value = state.profileDeduction !== undefined ? state.profileDeduction : 2.5;
        clientNameInput.value = state.clientName || "";
        updateChassisStockUI(state.chassisStockLength);
        updateDoorStockUI(state.doorStockLength);
        updateCalcUnitsBadge();
    }

    function saveState() {
        localStorage.setItem("aluminum_craftsman_state_v6", JSON.stringify(state));
    }

    // --- دالة مزامنة الضلف تلقائياً مع الأرفف والمطبقية مع احترام الضلف المحذوفة ---
    function syncUnitDoorsFromShelves(unit) {
        const d = parseFloat(state.profileDeduction || 0);
        const H = parseFloat(unit.height || 0);
        const actualPartH = Math.max(0, parseFloat(unit.partitionHeight) || (H - (d * 2)));
        const hType = unit.handleType || "external";
        const autoSplit = (unit.autoDoorSplit45 !== false);
        const deletedIds = Array.isArray(unit.deletedDoorIds) ? unit.deletedDoorIds : [];

        // الاحتفاظ بأي تفضيل مخصص للتقسيم (درفة مفردة أو درفتين) أو مقاسات خاصة
        const existingOverrides = {};
        const existingDoorProps = {};
        if (unit.doorsList && unit.doorsList.length > 0) {
            unit.doorsList.forEach(dr => {
                if (dr.sectionKey && dr.customSplitMode) {
                    existingOverrides[dr.sectionKey] = dr.customSplitMode;
                }
                if (dr.id) {
                    existingDoorProps[dr.id] = {
                        finalWidth: dr.finalWidth,
                        handleType: dr.handleType
                    };
                }
            });
        }

        const newDoors = [];

        // 1. درف المطبقية (للوحدات العلوية التي بها مطبقية - ليس لها رف شاسيه ألوميتال)
        if (unit.unitType === "upper" && unit.hasDishRack) {
            const rackSize = parseFloat(unit.dishRackSize || 70);
            const rackOpeningWidth = Math.max(0, rackSize - 3.0);
            const rackRawW = Math.round((rackOpeningWidth + 2.3) * 100) / 100;
            const secKey = "dish_rack";
            const override = existingOverrides[secKey];

            const isSplit = override === "double" ? true : (override === "single" ? false : (autoSplit && rackRawW > 45.0));

            if (isSplit) {
                const splitW = Math.round((rackRawW / 2.0) * 100) / 100;
                const d1 = {
                    id: `d_rack_1`,
                    source: "dish_rack",
                    sectionKey: secKey,
                    customSplitMode: override || (autoSplit && rackRawW > 45.0 ? "double" : "single"),
                    sourceLabel: `خانة المطبقية (مقاس ${rackSize}، صافي ${rackOpeningWidth} سم)`,
                    shelfWidth: rackOpeningWidth,
                    finalWidth: splitW,
                    handleType: (existingDoorProps['d_rack_1'] && existingDoorProps['d_rack_1'].handleType) || hType,
                    isSplit: true,
                    sectionLabel: "خانة المطبقية (درفة 1 من 2)"
                };
                const d2 = {
                    id: `d_rack_2`,
                    source: "dish_rack",
                    sectionKey: secKey,
                    customSplitMode: override || (autoSplit && rackRawW > 45.0 ? "double" : "single"),
                    sourceLabel: `خانة المطبقية (مقاس ${rackSize}، صافي ${rackOpeningWidth} سم)`,
                    shelfWidth: rackOpeningWidth,
                    finalWidth: splitW,
                    handleType: (existingDoorProps['d_rack_2'] && existingDoorProps['d_rack_2'].handleType) || hType,
                    isSplit: true,
                    sectionLabel: "خانة المطبقية (درفة 2 من 2)"
                };
                if (!deletedIds.includes(d1.id)) newDoors.push(d1);
                if (!deletedIds.includes(d2.id)) newDoors.push(d2);
            } else {
                const d1 = {
                    id: `d_rack_1`,
                    source: "dish_rack",
                    sectionKey: secKey,
                    customSplitMode: override || "single",
                    sourceLabel: `خانة المطبقية (مقاس ${rackSize}، صافي ${rackOpeningWidth} سم)`,
                    shelfWidth: rackOpeningWidth,
                    finalWidth: rackRawW,
                    handleType: (existingDoorProps['d_rack_1'] && existingDoorProps['d_rack_1'].handleType) || hType,
                    isSplit: false,
                    sectionLabel: "خانة المطبقية (درفة مفردة)"
                };
                if (!deletedIds.includes(d1.id)) newDoors.push(d1);
            }
        }

        // 2. درف الأرفف - مرتبطة مباشرة بكل خانة رف
        const shelves = unit.shelvesList || [];
        // تجميع الأرفف حسب الخانة حتى لا تتكرر الضلف عند وجود طبقتين (tiers) لنفس الخانة
        const sectionsMap = new Map();
        shelves.forEach((shelf, idx) => {
            const secKey = shelf.sectionId || `sec_custom_${shelf.id || idx}`;
            if (!sectionsMap.has(secKey)) {
                sectionsMap.set(secKey, {
                    key: secKey,
                    label: shelf.label || `رف #${idx + 1}`,
                    width: parseFloat(shelf.width || 0),
                    shelfIds: [shelf.id]
                });
            } else {
                sectionsMap.get(secKey).shelfIds.push(shelf.id);
            }
        });

        // إذا كانت العلبة بدون أرفف مضافة، نولد الضلف بناءً على عدد الفواصل اليدوية
        if (sectionsMap.size === 0 && (!unit.unitType || unit.unitType !== "upper" || !unit.hasDishRack)) {
            const P = Math.max(0, parseInt(unit.partitions) || 0);
            const N = P + 1; // عدد الخانات الناتجة
            const netInsideWidth = Math.max(0, parseFloat(unit.width || 0) - (2 * d) - (P * d));
            const secW = Math.round((netInsideWidth / N) * 100) / 100;
            for (let s = 1; s <= N; s++) {
                sectionsMap.set(`sec_part_${s}`, {
                    key: `sec_part_${s}`,
                    label: N > 1 ? `خانة #${s}` : `كامل العلبة`,
                    width: secW,
                    shelfIds: []
                });
            }
        }

        let sIndex = 1;
        sectionsMap.forEach((sec) => {
            const sWidth = Math.max(0, sec.width);
            const rawDoorW = Math.round((sWidth + 2.3) * 100) / 100;
            const cleanLabel = sec.label.replace(/ - رف #\d+/, "");
            const override = existingOverrides[sec.key];
            const isSplit = override === "double" ? true : (override === "single" ? false : (autoSplit && rawDoorW > 45.0));

            if (isSplit) {
                const splitW = Math.round((rawDoorW / 2.0) * 100) / 100;
                const id1 = `d_${sec.key}_1`;
                const id2 = `d_${sec.key}_2`;
                const d1 = {
                    id: id1,
                    source: "shelf",
                    sectionKey: sec.key,
                    customSplitMode: override || (autoSplit && rawDoorW > 45.0 ? "double" : "single"),
                    sourceLabel: `${cleanLabel} (عرض الرف ${sWidth} سم)`,
                    shelfWidth: sWidth,
                    finalWidth: (existingDoorProps[id1] && existingDoorProps[id1].finalWidth) || splitW,
                    handleType: (existingDoorProps[id1] && existingDoorProps[id1].handleType) || hType,
                    isSplit: true,
                    sectionLabel: `${cleanLabel} (درفة 1 من 2)`,
                    linkedShelfIds: sec.shelfIds
                };
                const d2 = {
                    id: id2,
                    source: "shelf",
                    sectionKey: sec.key,
                    customSplitMode: override || (autoSplit && rawDoorW > 45.0 ? "double" : "single"),
                    sourceLabel: `${cleanLabel} (عرض الرف ${sWidth} سم)`,
                    shelfWidth: sWidth,
                    finalWidth: (existingDoorProps[id2] && existingDoorProps[id2].finalWidth) || splitW,
                    handleType: (existingDoorProps[id2] && existingDoorProps[id2].handleType) || hType,
                    isSplit: true,
                    sectionLabel: `${cleanLabel} (درفة 2 من 2)`,
                    linkedShelfIds: sec.shelfIds
                };
                if (!deletedIds.includes(d1.id)) newDoors.push(d1);
                if (!deletedIds.includes(d2.id)) newDoors.push(d2);
            } else {
                const id1 = `d_${sec.key}_1`;
                const d1 = {
                    id: id1,
                    source: "shelf",
                    sectionKey: sec.key,
                    customSplitMode: override || "single",
                    sourceLabel: `${cleanLabel} (عرض الرف ${sWidth} سم)`,
                    shelfWidth: sWidth,
                    finalWidth: (existingDoorProps[id1] && existingDoorProps[id1].finalWidth) || rawDoorW,
                    handleType: (existingDoorProps[id1] && existingDoorProps[id1].handleType) || hType,
                    isSplit: false,
                    sectionLabel: `${cleanLabel} (درفة مفردة)`,
                    linkedShelfIds: sec.shelfIds
                };
                if (!deletedIds.includes(d1.id)) newDoors.push(d1);
            }
            sIndex++;
        });

        // 3. درف يدوية إضافية مخصصة تم إضافتها يدوياً
        if (unit.doorsList && unit.doorsList.length > 0) {
            unit.doorsList.forEach(dr => {
                if (dr.source === "custom" && !deletedIds.includes(dr.id)) {
                    newDoors.push(dr);
                }
            });
        }

        unit.doorsList = newDoors;
    }

    // --- دالة حساب أبعاد العلبة والفواصل يدوياً وحساب المطبقية ---
    function autoCalculateUnitDivisions(unit) {
        const d = parseFloat(state.profileDeduction || 0);
        const W = parseFloat(unit.width || 0);
        const H = parseFloat(unit.height || 0);
        const D = parseFloat(unit.depth || 0);
        const tiers = unit.shelfTiers !== undefined ? parseInt(unit.shelfTiers) : 1;
        const shelfDepth = D; // العمق ثابت = عمق الوحدة

        // تأكيد عدد الفواصل الرأسية (يدوي)
        if (unit.partitions === undefined || unit.partitions === null) {
            unit.partitions = 0;
        }
        unit.partitions = Math.max(0, parseInt(unit.partitions) || 0);

        // القاعدة المعتمدة: ارتفاع الفاصل = الارتفاع الكلي - (خصم التجميع × 2)
        if (unit.partitionHeight === undefined || unit.partitionHeight === null || unit.partitionHeight === "") {
            unit.partitionHeight = Math.max(0, H - (d * 2));
        }

        // ==============================================================
        // الحالة الأولى: وحدة علوية (فوق) وبها مطبقية
        // ==============================================================
        if (unit.unitType === "upper" && unit.hasDishRack) {
            const rackSize = parseFloat(unit.dishRackSize || 70);
            
            // 1. مقاس خانة المطبقية الداخلي = مقاس المطبقية - 3 سم
            const rackOpeningWidth = Math.max(0, rackSize - 3.0);
            
            // 2. صافي العرض الداخلي للعلبة = العرض الكلي - (2 * خصم الفريم الخارجي)
            const netOuterInside = Math.max(0, W - (2 * d));

            // 3. المتبقي الصافي = صافي العرض - (فتحة المطبقية + سمك فاصل المطبقية)
            const rackTotalReserved = rackOpeningWidth + d;
            const remainInsideWidth = Math.max(0, netOuterInside - rackTotalReserved);

            const remainMode = unit.dishRackRemainMode || "third_twothirds";
            let remainSections = [];

            if (remainMode === "third_twothirds") {
                const netRemain = Math.max(0, remainInsideWidth - d);
                const wThird = Math.round((netRemain / 3.0) * 100) / 100;
                const wTwoThirds = Math.round((2.0 * netRemain / 3.0) * 100) / 100;
                remainSections = [
                    { secId: "sec_rem_third", width: wThird, label: "قسم التلت" },
                    { secId: "sec_rem_twothirds", width: wTwoThirds, label: "قسم التلتين" }
                ];
            } else if (remainMode === "half") {
                const netRemain = Math.max(0, remainInsideWidth - d);
                const halfW = Math.round((netRemain / 2.0) * 100) / 100;
                remainSections = [
                    { secId: "sec_rem_half_1", width: halfW, label: "نصف المتبقي (1)" },
                    { secId: "sec_rem_half_2", width: halfW, label: "نصف المتبقي (2)" }
                ];
            } else if (remainMode === "three") {
                const netRemain = Math.max(0, remainInsideWidth - (2 * d));
                const secW = Math.round((netRemain / 3.0) * 100) / 100;
                remainSections = [
                    { secId: "sec_rem_3_1", width: secW, label: "خانة متبقي (1)" },
                    { secId: "sec_rem_3_2", width: secW, label: "خانة متبقي (2)" },
                    { secId: "sec_rem_3_3", width: secW, label: "خانة متبقي (3)" }
                ];
            } else if (remainMode === "custom") {
                if (!unit.shelvesList || unit.shelvesList.length === 0) {
                    unit.shelvesList = [{
                        id: `s_rem_custom_${Date.now()}`,
                        sectionId: "sec_rem_custom_1",
                        width: remainInsideWidth,
                        depth: shelfDepth,
                        label: "رف متبقي (مخصص)"
                    }];
                } else {
                    unit.shelvesList.forEach((s, sIdx) => {
                        s.depth = shelfDepth;
                        if (!s.sectionId) s.sectionId = `sec_rem_custom_${s.id || sIdx}`;
                    });
                }
                syncUnitDoorsFromShelves(unit);
                unit.calcMeta = {
                    isDishRack: true,
                    rackSize,
                    rackOpeningWidth,
                    netOuterInside,
                    remainInsideWidth,
                    remainMode: "custom",
                    doorsTotal: unit.doorsList.length,
                    shelvesTotal: unit.shelvesList.length
                };
                return;
            } else {
                remainSections = [
                    { secId: "sec_rem_full", width: remainInsideWidth, label: "المتبقي كاملاً" }
                ];
            }

            // توليد الأرفف
            unit.shelvesList = [];
            for (let tier = 1; tier <= tiers; tier++) {
                remainSections.forEach((sec) => {
                    unit.shelvesList.push({
                        id: `s_${sec.secId}_${tier}`,
                        sectionId: sec.secId,
                        width: sec.width,
                        depth: shelfDepth,
                        label: tiers > 1 ? `${sec.label} - رف #${tier}` : sec.label
                    });
                });
            }

            syncUnitDoorsFromShelves(unit);

            unit.calcMeta = {
                isDishRack: true,
                rackSize,
                rackOpeningWidth,
                netOuterInside,
                remainInsideWidth,
                remainMode,
                doorsTotal: unit.doorsList.length,
                shelvesTotal: unit.shelvesList.length
            };
            return;
        }

        // ==============================================================
        // الحالة الثانية: وحدة عادية (بدون مطبقية) - فواصل يدوية كاملة
        // ==============================================================
        if (unit.shelvesList) {
            unit.shelvesList.forEach((s, idx) => {
                if (!s.depth) s.depth = unit.depth;
                if (!s.sectionId) s.sectionId = `sec_custom_${s.id || idx}`;
            });
        }
        syncUnitDoorsFromShelves(unit);

        const P = unit.partitions;
        const N = P + 1; // عدد الفتحات/الخانات الناتجة
        const netInsideWidth = Math.max(0, W - (2 * d) - (P * d));
        const sectionWidth = Math.round((netInsideWidth / N) * 100) / 100;
        const rawDoorWidth = Math.round((sectionWidth + 2.3) * 100) / 100;
        const shouldSplit = (unit.autoDoorSplit45 !== false) && (rawDoorWidth > 45.0);

        unit.calcMeta = {
            isDishRack: false,
            netInsideWidth,
            partitions: P,
            openingsCount: N,
            sectionWidth,
            rawDoorWidth,
            isSplit: shouldSplit,
            splitWidth: shouldSplit ? Math.round((rawDoorWidth / 2.0) * 100) / 100 : rawDoorWidth,
            doorsTotal: unit.doorsList.length,
            shelvesTotal: (unit.shelvesList || []).length
        };
    }

    // --- Stock Selectors ---
    function updateChassisStockUI(length) {
        state.chassisStockLength = parseFloat(length);
        chassisStockPills.forEach(p => {
            const pillLen = parseFloat(p.dataset.length);
            if (pillLen === state.chassisStockLength) {
                p.classList.add("active");
            } else if (p.id !== "customChassisPill") {
                p.classList.remove("active");
            }
        });

        if (state.chassisStockLength !== 600 && state.chassisStockLength !== 650) {
            document.getElementById("customChassisPill").classList.add("active");
            customChassisBox.style.display = "block";
            customChassisInput.value = state.chassisStockLength;
        } else {
            document.getElementById("customChassisPill").classList.remove("active");
            customChassisBox.style.display = "none";
        }
        chassisStockSub.textContent = `عود بطول ${(state.chassisStockLength / 100).toFixed(2)} متر`;
    }

    function updateDoorStockUI(length) {
        state.doorStockLength = parseFloat(length);
        doorStockPills.forEach(p => {
            const pillLen = parseFloat(p.dataset.length);
            if (pillLen === state.doorStockLength) {
                p.classList.add("active");
            } else if (p.id !== "customDoorPill") {
                p.classList.remove("active");
            }
        });

        if (state.doorStockLength !== 600 && state.doorStockLength !== 650) {
            document.getElementById("customDoorPill").classList.add("active");
            customDoorBox.style.display = "block";
            customDoorInput.value = state.doorStockLength;
        } else {
            document.getElementById("customDoorPill").classList.remove("active");
            customDoorBox.style.display = "none";
        }
        doorStockSub.textContent = `عود بطول ${(state.doorStockLength / 100).toFixed(2)} متر`;
    }

    chassisStockPills.forEach(pill => {
        pill.addEventListener("click", () => {
            chassisStockPills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            if (pill.id === "customChassisPill") {
                customChassisBox.style.display = "block";
                state.chassisStockLength = parseFloat(customChassisInput.value) || 600;
            } else {
                customChassisBox.style.display = "none";
                state.chassisStockLength = parseFloat(pill.dataset.length);
            }
            chassisStockSub.textContent = `عود بطول ${(state.chassisStockLength / 100).toFixed(2)} متر`;
            saveState();
            markCalculationPending("تم تعديل طول عود الشاسيه - اضغط احسب لتحديث النتائج");
        });
    });

    customChassisInput.addEventListener("input", () => {
        state.chassisStockLength = parseFloat(customChassisInput.value) || 600;
        chassisStockSub.textContent = `عود بطول ${(state.chassisStockLength / 100).toFixed(2)} متر`;
        saveState();
        markCalculationPending("تم تعديل طول عود الشاسيه - اضغط احسب لتحديث النتائج");
    });

    doorStockPills.forEach(pill => {
        pill.addEventListener("click", () => {
            doorStockPills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            if (pill.id === "customDoorPill") {
                customDoorBox.style.display = "block";
                state.doorStockLength = parseFloat(customDoorInput.value) || 600;
            } else {
                customDoorBox.style.display = "none";
                state.doorStockLength = parseFloat(pill.dataset.length);
            }
            doorStockSub.textContent = `عود بطول ${(state.doorStockLength / 100).toFixed(2)} متر`;
            saveState();
            markCalculationPending("تم تعديل طول عود الضلف - اضغط احسب لتحديث النتائج");
        });
    });

    customDoorInput.addEventListener("input", () => {
        state.doorStockLength = parseFloat(customDoorInput.value) || 600;
        doorStockSub.textContent = `عود بطول ${(state.doorStockLength / 100).toFixed(2)} متر`;
        saveState();
        markCalculationPending("تم تعديل طول عود الضلف - اضغط احسب لتحديث النتائج");
    });

    bladeKerfInput.addEventListener("input", () => {
        state.bladeKerf = parseFloat(bladeKerfInput.value) || 0;
        saveState();
        markCalculationPending("تم تعديل سمك المنشار - اضغط احسب لتحديث النتائج");
    });

    profileDeductionInput.addEventListener("input", () => {
        state.profileDeduction = parseFloat(profileDeductionInput.value) || 0;
        const d = state.profileDeduction;
        state.units.forEach(u => {
            u.partitionHeight = Math.max(0, (parseFloat(u.height) || 0) - (d * 2));
            autoCalculateUnitDivisions(u);
        });
        saveState();
        renderUnits();
        markCalculationPending("تم تعديل خصم التجميع - اضغط احسب لتحديث النتائج");
    });

    clientNameInput.addEventListener("input", () => {
        state.clientName = clientNameInput.value.trim();
        saveState();
    });

    // --- Units Management ---
    addUnitBtn.addEventListener("click", () => {
        const nextNum = state.units.length + 1;
        const newUnit = {
            id: "u_" + Date.now(),
            name: `علبة مطبخ #${nextNum}`,
            unitType: "lower",
            hasDishRack: false,
            width: 100,
            height: 85,
            depth: 60,
            partitions: 0, // يبدأ بدون فواصل
            shelfTiers: 1,
            handleType: "external",
            autoDoorSplit45: false,
            quantity: 1
        };
        autoCalculateUnitDivisions(newUnit);
        state.units.push(newUnit);
        saveState();
        renderUnits();
        markCalculationPending("تم إضافة علبة جديدة - اضغط احسب لتحديث النتائج");
        showToast("✓ تم إضافة علبة جديدة");
    });

    clearAllUnitsBtn.addEventListener("click", () => {
        if (state.units.length === 0) return;
        if (confirm("هل تريد تفريغ ومسح جميع العلب؟")) {
            state.units = [];
            saveState();
            renderUnits();
            recalculateAll();
            markCalculationFresh();
            showToast("تم تفريغ القائمة");
        }
    });

    // --- دالة توليد كود HTML للضلف المرتبطة بالأرفف والمطبقية ---
    function buildDoorsHtml(unit, actualPartH) {
        if (!unit.doorsList || unit.doorsList.length === 0) {
            return '<div class="empty-sub-notice">لا توجد ضلف مضافة (تنشأ تلقائياً مع الأرفف أو المطبقية)</div>';
        }

        const d = parseFloat(state.profileDeduction || 0);
        const partH = parseFloat(actualPartH) || (unit.height - (d * 2));

        let html = "";
        unit.doorsList.forEach((door, dIdx) => {
            const handleType = door.handleType || unit.handleType || "external";
            const extraH = handleType === "external" ? 3.0 : 0.0;
            const doorH = (partH + extraH).toFixed(1);
            const doorW = parseFloat(door.finalWidth || (door.shelfWidth + 2.3)).toFixed(1);
            const isRack = (door.source === "dish_rack");

            html += `
                <div class="door-item-row ${isRack ? 'door-rack-row' : ''}" data-door-id="${door.id}">
                    <div class="door-row-top">
                        <div class="door-title-box">
                            <span class="door-source-icon">${isRack ? '🍽️' : '📚'}</span>
                            <span class="door-item-label">${escapeHtml(door.sectionLabel || ('ضلفة #' + (dIdx + 1)))}</span>
                        </div>
                        <div class="door-actions-box">
                            <span class="door-calc-badge" title="مقاس تقطيع الضلفة الصافي (العرض × الارتفاع)">
                                مقاس الدرفة: ${doorW} × ${doorH} سم
                            </span>
                            <button type="button" class="door-del-btn" data-unit-id="${unit.id}" data-door-id="${door.id}" title="مسح هذه الدرفة (مثلاً إذا كان الرف مكشوفاً بدون درفة)">✕</button>
                        </div>
                    </div>
                    <div class="door-row-source-info">
                        <span>مرتبطة بـ: <strong>${escapeHtml(door.sourceLabel || '')}</strong></span>
                        ${door.isSplit ? 
                            '<span class="split-pill">درفة مزدوجة (عرض > 45)</span>' : 
                            '<span class="single-pill">درفة مفردة</span>'
                        }
                    </div>
                    <div class="door-row-controls">
                        <div class="door-input-wrap">
                            <label>عرض الدرفة:</label>
                            <input type="number" step="0.1" class="door-finalw-input" value="${doorW}" data-unit-id="${unit.id}" data-door-id="${door.id}" min="5" max="400" title="يمكنك تعديل عرض الدرفة يدوياً إذا رغبت">
                            <label>سم</label>
                        </div>
                        <div class="door-controls-group">
                            <select class="handle-select" data-unit-id="${unit.id}" data-door-id="${door.id}" title="نوع المقبض">
                                <option value="external" ${handleType === "external" ? "selected" : ""}>مقبض خارجي (+3سم)</option>
                                <option value="builtin" ${handleType === "builtin" ? "selected" : ""}>بلت إن (ارتفاع الفاصل)</option>
                            </select>
                            <button type="button" class="door-split-toggle-btn" data-unit-id="${unit.id}" data-door-id="${door.id}" title="تبديل بين درفة مفردة ودرفتين">
                                ${door.isSplit ? 'تحويل لمفردة ⮂' : 'تقسيم لدرفتين ⮂'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        return html;
    }

    // --- تحديث شارة مقاس الدرفة عند التعديل اللحظي ---
    function updateDoorBadge(rowEl, door, unit) {
        if (!rowEl || !door || !unit) return;
        const d = parseFloat(state.profileDeduction || 0);
        const partH = parseFloat(unit.partitionHeight) || (unit.height - (d * 2));
        const handleType = door.handleType || unit.handleType || "external";
        const extraH = handleType === "external" ? 3.0 : 0.0;
        const doorH = (partH + extraH).toFixed(1);
        const doorW = parseFloat(door.finalWidth || (door.shelfWidth + 2.3)).toFixed(1);
        const badge = rowEl.querySelector(".door-calc-badge");
        if (badge) {
            badge.textContent = `مقاس الدرفة: ${doorW} × ${doorH} سم`;
        }
    }

    // --- ربط أحداث عناصر الضلف التفاعلية داخل أي حاوية ---
    function attachDoorEvents(container, unit) {
        if (!container || !unit) return;

        // مسح درفة معينة (مثلاً رف مفتوح بدون درفة)
        container.querySelectorAll(".door-del-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const doorId = btn.dataset.doorId;
                if (!unit.deletedDoorIds) unit.deletedDoorIds = [];
                if (!unit.deletedDoorIds.includes(doorId)) {
                    unit.deletedDoorIds.push(doorId);
                }
                const targetDoor = (unit.doorsList || []).find(d => d.id === doorId);
                const doorLabel = targetDoor ? (targetDoor.sectionLabel || "الدرفة") : "الدرفة";
                unit.doorsList = (unit.doorsList || []).filter(d => d.id !== doorId);
                saveState();
                renderUnits();
                markCalculationPending();
                showToast(`✓ تم مسح ${doorLabel} (الرف الآن مكشوف بدون درفة)`);
            });
        });

        // تعديل عرض الدرفة يدوياً
        container.querySelectorAll(".door-finalw-input").forEach(input => {
            input.addEventListener("input", (e) => {
                const doorId = e.target.dataset.doorId;
                const val = parseFloat(e.target.value) || 0;
                if (unit.doorsList) {
                    const door = unit.doorsList.find(d => d.id === doorId);
                    if (door) {
                        door.finalWidth = val;
                        updateDoorBadge(e.target.closest(".door-item-row"), door, unit);
                        saveState();
                        markCalculationPending();
                    }
                }
            });
        });

        // تعديل نوع مقبض ضلفة فردية
        container.querySelectorAll(".handle-select").forEach(select => {
            select.addEventListener("change", (e) => {
                const doorId = e.target.dataset.doorId;
                const val = e.target.value;
                if (unit.doorsList) {
                    const door = unit.doorsList.find(d => d.id === doorId);
                    if (door) {
                        door.handleType = val;
                        updateDoorBadge(e.target.closest(".door-item-row"), door, unit);
                        saveState();
                        markCalculationPending();
                    }
                }
            });
        });

        // زر تبديل التقسيم (مفردة ⮂ درفتين)
        container.querySelectorAll(".door-split-toggle-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const doorId = btn.dataset.doorId;
                if (unit.doorsList) {
                    const door = unit.doorsList.find(d => d.id === doorId);
                    if (door && door.sectionKey) {
                        const newMode = door.isSplit ? "single" : "double";
                        unit.doorsList.forEach(d => {
                            if (d.sectionKey === door.sectionKey) {
                                d.customSplitMode = newMode;
                            }
                        });
                        syncUnitDoorsFromShelves(unit);
                        const actualPartH = (parseFloat(unit.partitionHeight) || (unit.height - (parseFloat(state.profileDeduction || 0) * 2)));
                        container.innerHTML = buildDoorsHtml(unit, actualPartH);
                        attachDoorEvents(container, unit);
                        saveState();
                        renderUnits();
                        markCalculationPending();
                        showToast(`✓ تم ضبط: ${newMode === 'double' ? 'درفتين مزدوجتين' : 'درفة مفردة'}`);
                    }
                }
            });
        });
    }

    function renderUnits() {
        unitsCountBadge.textContent = state.units.length;

        if (state.units.length === 0) {
            unitsContainer.innerHTML = `
                <div class="empty-units-notice">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                    </svg>
                    <p style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px;">لا توجد علب مطبخ مضافة حتى الآن</p>
                    <p style="font-size: 0.85rem;">اضغط على <strong>+ إضافة علبة جديدة</strong> أو اختر قالباً سريعاً من القائمة الجانبية.</p>
                </div>
            `;
            return;
        }

        unitsContainer.innerHTML = "";
        state.units.forEach((unit) => {
            const card = document.createElement("div");
            card.className = "unit-card";
            card.dataset.id = unit.id;

            const uType = unit.unitType || "lower";
            const isUpper = (uType === "upper");
            const hasDishRack = (isUpper && unit.hasDishRack);
            const rackDoors = (unit.doorsList || []).filter(door => door.source === "dish_rack");
            const meta = unit.calcMeta || {};
            const d = parseFloat(state.profileDeduction || 0);
            const actualPartH = (parseFloat(unit.partitionHeight) || (unit.height - (d * 2))).toFixed(1);
            const drawerEnabled = !isUpper && unit.hasDrawers === true;
            const drawerOpeningWidth = Number.isFinite(parseFloat(unit.drawerOpeningWidth))
                ? parseFloat(unit.drawerOpeningWidth)
                : "";
            const drawerWidth = drawerOpeningWidth === "" ? null : Math.max(0, drawerOpeningWidth - 2.6);
            const drawerDepth = Math.max(0, parseFloat(unit.depth || 0) - 3);
            const drawerCount = Math.max(1, parseInt(unit.drawerCount) || 1);

            // مربع خيارات المطبقية (يظهر فقط إذا كانت الوحدة علوية)
            let dishRackHtml = "";
            if (isUpper) {
                const rackSize = unit.dishRackSize || 70;
                const remMode = unit.dishRackRemainMode || "third_twothirds";

                dishRackHtml = `
                    <div class="dish-rack-box">
                        <div class="dr-header">
                            <span class="dr-title">🍽️ خيار المطبقية للوحدة العلوية:</span>
                            <div class="dr-toggle-group">
                                <button type="button" class="dr-btn ${hasDishRack ? 'active' : ''}" data-unit-id="${unit.id}" data-action="dishRackToggle" data-val="true">نعم، يوجد مطبقية</button>
                                <button type="button" class="dr-btn ${!hasDishRack ? 'active' : ''}" data-unit-id="${unit.id}" data-action="dishRackToggle" data-val="false">لا يوجد مطبقية</button>
                            </div>
                        </div>

                        ${hasDishRack ? `
                        <div class="dr-options-grid">
                            <!-- اختيار مقاس المطبقية -->
                            <div>
                                <span class="dr-opt-label">مقاس المطبقية (الصافي = المقاس - 3 سم):</span>
                                <div class="sdb-pills">
                                    <button type="button" class="sdb-btn ${rackSize === 60 ? 'active' : ''}" data-unit-id="${unit.id}" data-action="rackSize" data-val="60">60 سم (صافي 57)</button>
                                    <button type="button" class="sdb-btn ${rackSize === 70 ? 'active' : ''}" data-unit-id="${unit.id}" data-action="rackSize" data-val="70">70 سم (صافي 67)</button>
                                    <button type="button" class="sdb-btn ${rackSize === 80 ? 'active' : ''}" data-unit-id="${unit.id}" data-action="rackSize" data-val="80">80 سم (صافي 77)</button>
                                </div>
                            </div>

                            <!-- خيارات تقسيم الجزء المتبقي -->
                            <div>
                                <span class="dr-opt-label">تقسيم الجزء المتبقي (${meta.remainInsideWidth || 0} سم):</span>
                                <div class="sdb-pills">
                                    <button type="button" class="sdb-btn ${remMode === 'third_twothirds' ? 'active' : ''}" data-unit-id="${unit.id}" data-action="remainMode" data-val="third_twothirds">ثلث وثلثين</button>
                                    <button type="button" class="sdb-btn ${remMode === 'half' ? 'active' : ''}" data-unit-id="${unit.id}" data-action="remainMode" data-val="half">نصفين</button>
                                    <button type="button" class="sdb-btn ${remMode === 'three' ? 'active' : ''}" data-unit-id="${unit.id}" data-action="remainMode" data-val="three">3 خانات</button>
                                    <button type="button" class="sdb-btn ${remMode === 'full' ? 'active' : ''}" data-unit-id="${unit.id}" data-action="remainMode" data-val="full">كاملة</button>
                                    <button type="button" class="sdb-btn ${remMode === 'custom' ? 'active' : ''}" data-unit-id="${unit.id}" data-action="remainMode" data-val="custom">مخصص</button>
                                </div>
                            </div>
                        </div>

                        <!-- شريط توضيح حساب المطبقية والمتبقي -->
                        <div class="sdb-calc-summary">
                            <div class="sdb-calc-item">صافي الوحدة: <strong>${meta.netOuterInside || 0} سم</strong></div>
                            <div class="sdb-calc-item">خانة المطبقية: <strong>${meta.rackOpeningWidth || 0} سم</strong> (${rackSize} - 3) + فاصل <strong>${d} سم</strong></div>
                            <div class="sdb-calc-item">المتبقي الصافي: <strong>${meta.remainInsideWidth || 0} سم</strong></div>
                            <div class="sdb-calc-item">ارتفاع الفاصل: <strong>${actualPartH} سم</strong></div>
                            <div class="sdb-calc-item">
                                ${remMode === 'custom' ?
                                    `<span class="sdb-alert-badge safe">⚙️ وضع مخصص: يمكنك تعديل مقاسات الأرفف، والضلف، وعدد الفواصل بالأسفل يدوياً</span>` :
                                    `<span class="sdb-alert-badge safe">🍽️ درف المطبقية: ${rackDoors.length === 0 ? 'بدون درفة' : rackDoors.length > 1 ? 'درفتين' : 'درفة واحدة'}${rackDoors.length > 0 ? ` (${Math.round(parseFloat(rackDoors[0].finalWidth) * 100) / 100} سم لكل درفة)` : ''}</span>`
                                }
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
            }

            // قسم الفواصل الرأسية (يدوي) للوحدة
            const P = Math.max(0, parseInt(unit.partitions) || 0);
            const N = P + 1;
            const partD = Math.max(0, parseFloat(unit.depth || 0) - (d * 2)).toFixed(1);
            const netInside = Math.max(0, parseFloat(unit.width || 0) - (2 * d) - (P * d));
            const secW = (netInside / N).toFixed(1);

            const partitionSectionHtml = `
                <div class="partition-section-box">
                    <div class="psb-header">
                        <div class="psb-title-wrap">
                            <span class="psb-icon">🚪</span>
                            <span class="psb-title">قسم الفواصل الرأسية (يدوي):</span>
                            <span class="psb-badge">${P > 0 ? `${P} فاصل (${N} خانات)` : 'بدون فواصل داخلية'}</span>
                        </div>
                        <div class="psb-controls">
                            <button type="button" class="btn-counter btn-dec-part" data-unit-id="${unit.id}" title="تقليل فاصل">-</button>
                            <input type="number" min="0" max="20" class="partition-qty-input" value="${P}" data-unit-id="${unit.id}" data-field="partitions" title="أدخل عدد الفواصل يدوياً">
                            <button type="button" class="btn-counter btn-inc-part" data-unit-id="${unit.id}" title="زيادة فاصل">+</button>
                            <span class="psb-unit-label">فاصل رأسي</span>
                        </div>
                    </div>
                    <div class="psb-details-grid">
                        <div class="psb-detail-item">
                            <label>ارتفاع الفاصل:</label>
                            <div class="psb-input-row">
                                <input type="number" step="0.1" value="${actualPartH}" min="5" max="300" data-unit-id="${unit.id}" class="part-h-input" title="ارتفاع الفاصل = الارتفاع الكلي - (خصم التجميع × 2)">
                                <span>سم</span>
                            </div>
                            <small class="psb-hint">${unit.height} - (${d} × 2)</small>
                        </div>
                        <div class="psb-detail-item">
                            <label>عمق تثبيت الفاصل:</label>
                            <div class="psb-input-row">
                                <input type="number" value="${partD}" readonly style="opacity: 0.85;" title="عمق الفاصل = عمق العلبة - (خصم التجميع × 2)">
                                <span>سم</span>
                            </div>
                            <small class="psb-hint">${unit.depth} - (${d} × 2)</small>
                        </div>
                        <div class="psb-detail-item psb-summary-item">
                            <label>قطع ألوميتال الفواصل للعلبة:</label>
                            <div class="psb-cuts-preview">
                                ${P > 0 ? 
                                    `<span><strong>${P * 2}</strong> قائم (${actualPartH} سم) + <strong>${P * 2}</strong> عمق (${partD} سم)</span>` : 
                                    `<span style="color: var(--text-muted);">لا توجد فواصل مضافة</span>`
                                }
                            </div>
                            <div class="psb-openings-info">
                                ${P > 0 ? 
                                    `العلبة مقسمة إلى <strong>${N} خانات</strong>، صافي عرض كل خانة: <strong>${secW} سم</strong>` : 
                                    `العلبة مفتوحة خانة واحدة بعرض صافي: <strong>${secW} سم</strong>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const drawerOptionsHtml = !isUpper ? `
                <div class="drawer-options-box">
                    <label class="drawer-toggle-label">
                        <input type="checkbox" class="drawer-enabled-input" data-unit-id="${unit.id}" ${drawerEnabled ? "checked" : ""}>
                        <span>يوجد أدراج بقطاع 2×8</span>
                    </label>
                    ${drawerEnabled ? `
                        <div class="drawer-fields-grid">
                            <label>
                                عدد الأدراج
                                <input type="number" class="drawer-count-input" data-unit-id="${unit.id}" value="${drawerCount}" min="1" max="50" step="1">
                            </label>
                            <label>
                                عرض فتحة الدرج (سم)
                                <input type="number" class="drawer-opening-input" data-unit-id="${unit.id}" value="${drawerOpeningWidth}" min="2.6" max="400" step="0.1" placeholder="أدخل عرض الفتحة">
                            </label>
                        </div>
                        <div class="drawer-size-preview">
                            ${drawerWidth === null
                                ? "أدخل عرض الفتحة لحساب مقاس قطع الدرج."
                                : `لكل درج: قطعتان عرض <strong>${drawerWidth.toFixed(1)} سم</strong> + قطعتان عمق <strong>${drawerDepth.toFixed(1)} سم</strong> (عرض الفتحة − 2.6 سم، وعمق الوحدة − 3 سم).`}
                        </div>
                    ` : ""}
                </div>
            ` : "";

            // قائمة الأرفف
            let shelvesHtml = "";
            (unit.shelvesList || []).forEach((shelf, sIdx) => {
                const label = shelf.label || `رف #${sIdx + 1}`;
                shelvesHtml += `
                    <div class="shelf-item-row" data-shelf-id="${shelf.id}">
                        <div class="shelf-header-box">
                            <span class="shelf-item-label">${label}:</span>
                            <button type="button" class="shelf-del-btn" data-unit-id="${unit.id}" data-shelf-id="${shelf.id}" title="حذف هذا الرف">✕</button>
                        </div>
                        <div class="shelf-inputs-box">
                            <div class="shelf-input-wrap">
                                <label>العرض:</label>
                                <input type="number" step="0.1" class="shelf-w-input" value="${shelf.width}" data-unit-id="${unit.id}" data-shelf-id="${shelf.id}" min="5" max="400">
                                <label>سم</label>
                            </div>
                            <div class="shelf-input-wrap">
                                <label>العمق (ثابت):</label>
                                <input type="number" class="shelf-d-input" value="${shelf.depth || unit.depth}" data-unit-id="${unit.id}" data-shelf-id="${shelf.id}" min="5" max="150" readonly style="opacity: 0.8;" title="العمق ثابت ويطابق عمق الوحدة">
                                <label>سم</label>
                            </div>
                        </div>
                    </div>
                `;
            });

            // قائمة الضلف (مرتبطة تلقائياً بالأرفف والمطبقية)
            const doorsHtml = buildDoorsHtml(unit, actualPartH);

            card.innerHTML = `
                <div class="unit-card-header">
                    <div class="unit-header-top-row">
                        <input type="text" class="unit-name-input" value="${escapeHtml(unit.name)}" data-id="${unit.id}" data-field="name" title="اضغط لتعديل الاسم">
                        
                        <div class="unit-card-actions">
                            <button type="button" class="unit-act-btn duplicate-btn" data-id="${unit.id}" title="تكرار العلبة بنفس مقاساتها">
                                <span>نسخ</span> 📑
                            </button>
                            <button type="button" class="unit-act-btn delete-btn" data-id="${unit.id}" title="حذف العلبة">
                                <span>حذف</span> 🗑️
                            </button>
                        </div>
                    </div>

                    <!-- زر اختيار نوع الوحدة: فوق (علوي) أو تحت (سفلي) -->
                    <div class="unit-type-pills">
                        <button type="button" class="unit-type-btn type-upper ${isUpper ? 'active' : ''}" data-unit-id="${unit.id}" data-type="upper">🔼 وحدة فوق (علوي)</button>
                        <button type="button" class="unit-type-btn type-lower ${!isUpper ? 'active' : ''}" data-unit-id="${unit.id}" data-type="lower">🔽 وحدة تحت (سفلي)</button>
                    </div>
                </div>

                <!-- الأبعاد الأساسية للهيكل -->
                <div class="unit-dimensions-grid">
                    <div class="dim-box">
                        <label>العرض الكلي</label>
                        <input type="number" value="${unit.width}" min="10" max="400" data-id="${unit.id}" data-field="width">
                        <span class="dim-unit">سم</span>
                    </div>

                    <div class="dim-box">
                        <label>الارتفاع الكلي</label>
                        <input type="number" value="${unit.height}" min="10" max="300" data-id="${unit.id}" data-field="height">
                        <span class="dim-unit">سم</span>
                    </div>

                    <div class="dim-box">
                        <label>العمق (ثابت)</label>
                        <input type="number" value="${unit.depth}" min="10" max="150" data-id="${unit.id}" data-field="depth" title="العمق ثابت ويطبق تلقائياً على كل الأرفف">
                        <span class="dim-unit">سم</span>
                    </div>

                    <div class="dim-box" style="border-color: rgba(245, 158, 11, 0.4);">
                        <label style="color: var(--accent-gold);">ارتفاع الفاصل</label>
                        <input type="number" step="0.1" value="${actualPartH}" min="10" max="300" data-id="${unit.id}" data-field="partitionHeight" title="ارتفاع الفاصل = الارتفاع الكلي - (خصم التجميع × 2)">
                        <span class="dim-unit">سم</span>
                    </div>

                    <div class="dim-box" style="border-color: rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.05);" title="عدد الفواصل الرأسية (يدوي)">
                        <label style="color: #38bdf8;">عدد الفواصل (يدوي)</label>
                        <input type="number" min="0" max="20" value="${P}" data-id="${unit.id}" data-field="partitions">
                        <span class="dim-unit" style="color: #38bdf8; opacity: 0.85;">فاصل</span>
                    </div>

                    <div class="dim-box" style="border-color: rgba(59, 130, 246, 0.4);">
                        <label style="color: var(--primary);">تكرار العلبة</label>
                        <input type="number" value="${unit.quantity || 1}" min="1" max="50" data-id="${unit.id}" data-field="quantity">
                        <span class="dim-unit">عدد</span>
                    </div>
                </div>

                ${drawerOptionsHtml}

                <!-- قسم المطبقية (لوحدة فوق) -->
                ${dishRackHtml}

                <!-- قسم الفواصل الرأسية (يدوي) -->
                ${partitionSectionHtml}

                <!-- قسم الأرفف المخصصة والضلف -->
                <div class="unit-sub-sections">
                    <!-- 1. قسم الأرفف المخصصة -->
                    <div class="sub-section-box">
                        <div class="sub-section-header">
                            <h4 class="shelves-title">📚 الأرفف (${(unit.shelvesList || []).length})</h4>
                            <div style="display: flex; gap: 6px;">
                                <select class="tier-select form-control" data-unit-id="${unit.id}" style="padding: 2px 8px; font-size: 0.76rem; width: auto;" title="عدد الأرفف لكل خانة">
                                    <option value="1" ${(unit.shelfTiers === 1 || unit.shelfTiers === undefined) ? 'selected' : ''}>1 رف لكل خانة</option>
                                    <option value="2" ${unit.shelfTiers === 2 ? 'selected' : ''}>رفين لكل خانة</option>
                                    <option value="0" ${unit.shelfTiers === 0 ? 'selected' : ''}>بدون أرفف</option>
                                </select>
                                <button type="button" class="btn btn-sm btn-secondary-soft add-shelf-btn" data-unit-id="${unit.id}">
                                    + رف يدوي
                                </button>
                            </div>
                        </div>
                        <div class="sub-items-list">
                            ${shelvesHtml || '<div class="empty-sub-notice">لا توجد أرفف مضافة</div>'}
                        </div>
                    </div>

                    <!-- 2. قسم الضلف المرتبطة تلقائياً بالأرفف والمطبقية -->
                    <div class="sub-section-box">
                        <div class="sub-section-header">
                            <h4 class="doors-title">🚪 الضلف (${(unit.doorsList || []).length})</h4>
                            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                                ${(unit.deletedDoorIds && unit.deletedDoorIds.length > 0) ? `
                                    <button type="button" class="btn btn-sm btn-outline-warning restore-doors-btn" data-unit-id="${unit.id}" style="padding: 2px 7px; font-size: 0.72rem;" title="استرجاع جميع الضلف التي قمت بمسحها لهذه العلبة">
                                        استرجاع (${unit.deletedDoorIds.length}) ↺
                                    </button>
                                ` : ''}
                                <select class="global-handle-select form-control" data-unit-id="${unit.id}" style="padding: 2px 8px; font-size: 0.76rem; width: auto;" title="نوع مقبض العلبة">
                                    <option value="external" ${(unit.handleType === 'external' || !unit.handleType) ? 'selected' : ''}>مقبض خارجي (+3سم)</option>
                                    <option value="builtin" ${unit.handleType === 'builtin' ? 'selected' : ''}>بلت إن (ارتفاع الفاصل)</option>
                                </select>
                            </div>
                        </div>
                        <div class="sub-items-list doors-list-container" data-unit-id="${unit.id}">
                            ${doorsHtml}
                        </div>
                    </div>
                </div>
            `;
            unitsContainer.appendChild(card);
        });

        attachCardEvents();
    }

    function attachCardEvents() {
        // زر اختيار نوع الوحدة: فوق (علوي) أو تحت (سفلي)
        unitsContainer.querySelectorAll(".unit-type-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const unitId = btn.dataset.unitId;
                const type = btn.dataset.type;
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit) {
                    targetUnit.unitType = type;
                    // إذا أصبحت علوية، يمكن تفعيل المطبقية افتراضياً أو إبقاؤها اختيارية
                    if (type === "upper" && targetUnit.hasDishRack === undefined) {
                        targetUnit.hasDishRack = true;
                        targetUnit.dishRackSize = 70;
                        targetUnit.dishRackRemainMode = "third_twothirds";
                    }
                    autoCalculateUnitDivisions(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending();
                    showToast(`✓ تم ضبط الوحدة: ${type === 'upper' ? '🔼 علوية (فوق)' : '🔽 سفلية (تحت)'}`);
                }
            });
        });

        // زر تفعيل/إلغاء المطبقية
        unitsContainer.querySelectorAll(".dr-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const unitId = btn.dataset.unitId;
                const val = (btn.dataset.val === "true");
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit) {
                    targetUnit.hasDishRack = val;
                    if (val && !targetUnit.dishRackSize) targetUnit.dishRackSize = 70;
                    if (val && !targetUnit.dishRackRemainMode) targetUnit.dishRackRemainMode = "third_twothirds";
                    autoCalculateUnitDivisions(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending();
                    showToast(val ? "✓ تم تفعيل خيار المطبقية" : "تم إلغاء المطبقية");
                }
            });
        });

        // خيارات مقاس المطبقية أو تقسيم المتبقي
        unitsContainer.querySelectorAll(".sdb-btn[data-action]").forEach(btn => {
            btn.addEventListener("click", () => {
                const unitId = btn.dataset.unitId;
                const action = btn.dataset.action;
                const val = btn.dataset.val;
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit) {
                    if (action === "rackSize") {
                        targetUnit.dishRackSize = parseFloat(val);
                    } else if (action === "remainMode") {
                        targetUnit.dishRackRemainMode = val;
                    }
                    autoCalculateUnitDivisions(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending();
                }
            });
        });

        // أزرار زيادة وتقليل الفواصل يدوياً (Manual Partitions Counters)
        unitsContainer.querySelectorAll(".btn-dec-part").forEach(btn => {
            btn.addEventListener("click", () => {
                const unitId = btn.dataset.unitId;
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit) {
                    const cur = Math.max(0, parseInt(targetUnit.partitions) || 0);
                    if (cur > 0) {
                        targetUnit.partitions = cur - 1;
                        autoCalculateUnitDivisions(targetUnit);
                        saveState();
                        renderUnits();
                        markCalculationPending("تم تعديل عدد الفواصل - اضغط احسب لتحديث النتائج");
                        showToast(`✓ عدد الفواصل للعلبة: ${targetUnit.partitions}`);
                    }
                }
            });
        });

        unitsContainer.querySelectorAll(".btn-inc-part").forEach(btn => {
            btn.addEventListener("click", () => {
                const unitId = btn.dataset.unitId;
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit) {
                    const cur = Math.max(0, parseInt(targetUnit.partitions) || 0);
                    targetUnit.partitions = cur + 1;
                    autoCalculateUnitDivisions(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending("تم تعديل عدد الفواصل - اضغط احسب لتحديث النتائج");
                    showToast(`✓ عدد الفواصل للعلبة: ${targetUnit.partitions}`);
                }
            });
        });

        // إدخال عدد الفواصل يدوياً
        unitsContainer.querySelectorAll(".partition-qty-input").forEach(input => {
            input.addEventListener("change", (e) => {
                const unitId = e.target.dataset.unitId;
                const val = Math.max(0, parseInt(e.target.value) || 0);
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit) {
                    targetUnit.partitions = val;
                    autoCalculateUnitDivisions(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending("تم تعديل عدد الفواصل - اضغط احسب لتحديث النتائج");
                    showToast(`✓ تم ضبط عدد الفواصل: ${val}`);
                }
            });
        });

        // تعديل ارتفاع الفاصل يدوياً
        unitsContainer.querySelectorAll(".part-h-input").forEach(input => {
            input.addEventListener("change", (e) => {
                const unitId = e.target.dataset.unitId;
                const val = Math.max(0, parseFloat(e.target.value) || 0);
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit) {
                    targetUnit.partitionHeight = val;
                    autoCalculateUnitDivisions(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending("تم تعديل ارتفاع الفاصل - اضغط احسب لتحديث النتائج");
                }
            });
        });

        // تغيير عدد طبقات الأرفف
        unitsContainer.querySelectorAll(".tier-select").forEach(sel => {
            sel.addEventListener("change", (e) => {
                const unitId = e.target.dataset.unitId;
                const val = parseInt(e.target.value);
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit) {
                    targetUnit.shelfTiers = val;
                    autoCalculateUnitDivisions(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending();
                }
            });
        });

        unitsContainer.querySelectorAll(".drawer-enabled-input").forEach(input => {
            input.addEventListener("change", (e) => {
                const targetUnit = state.units.find(unit => unit.id === e.target.dataset.unitId);
                if (!targetUnit) return;

                targetUnit.hasDrawers = e.target.checked;
                if (targetUnit.hasDrawers && !targetUnit.drawerCount) targetUnit.drawerCount = 1;
                autoCalculateUnitDivisions(targetUnit);
                saveState();
                renderUnits();
                markCalculationPending("تم تعديل خيار الأدراج - اضغط احسب لتحديث النتائج");
            });
        });

        unitsContainer.querySelectorAll(".drawer-count-input, .drawer-opening-input").forEach(input => {
            input.addEventListener("change", (e) => {
                const targetUnit = state.units.find(unit => unit.id === e.target.dataset.unitId);
                if (!targetUnit) return;

                if (e.target.classList.contains("drawer-count-input")) {
                    targetUnit.drawerCount = Math.min(50, Math.max(1, parseInt(e.target.value) || 1));
                } else {
                    const openingWidth = parseFloat(e.target.value);
                    targetUnit.drawerOpeningWidth = Number.isFinite(openingWidth) ? openingWidth : null;
                }

                saveState();
                renderUnits();
                markCalculationPending("تم تعديل مقاس الأدراج - اضغط احسب لتحديث النتائج");
            });
        });

        // ربط أحداث الضلف لكل بطاقة علبة
        state.units.forEach(unit => {
            const card = unitsContainer.querySelector(`.unit-card[data-id="${unit.id}"]`);
            if (card) {
                const doorsContainer = card.querySelector(".doors-list-container");
                if (doorsContainer) attachDoorEvents(doorsContainer, unit);
            }
        });

        // تغيير نوع المقبض العام للعلبة
        unitsContainer.querySelectorAll(".global-handle-select").forEach(sel => {
            sel.addEventListener("change", (e) => {
                const unitId = e.target.dataset.unitId;
                const val = e.target.value;
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit) {
                    targetUnit.handleType = val;
                    syncUnitDoorsFromShelves(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending();
                    showToast(`✓ تم ضبط المقبض: ${val === 'external' ? 'مقبض خارجي (+3سم)' : 'بلت إن'}`);
                }
            });
        });

        // استرجاع جميع الضلف المحذوفة للعلبة
        unitsContainer.querySelectorAll(".restore-doors-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const unitId = btn.dataset.unitId;
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit) {
                    targetUnit.deletedDoorIds = [];
                    syncUnitDoorsFromShelves(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending();
                    showToast("✓ تم استرجاع جميع الضلف لهذه العلبة");
                }
            });
        });

        // تغيير المدخلات الرئيسية للعلبة وتحديث ارتفاع الفاصل تلقائياً مع الارتفاع الكلي
        unitsContainer.querySelectorAll(".dim-box input, .unit-name-input").forEach(input => {
            // تحديث فوري مرئي أثناء كتابة الارتفاع الكلي
            input.addEventListener("input", (e) => {
                const id = e.target.dataset.id;
                const field = e.target.dataset.field;
                if (field === "height") {
                    const val = parseFloat(e.target.value) || 0;
                    const targetUnit = state.units.find(u => u.id === id);
                    if (targetUnit) {
                        const d = parseFloat(state.profileDeduction || 0);
                        const newPartH = Math.max(0, val - (d * 2));
                        targetUnit.height = val;
                        targetUnit.partitionHeight = newPartH;

                        // تحديث حقول إدخال وتفاصيل ارتفاع الفاصل داخل نفس كارت العلبة فورياً
                        const card = e.target.closest(".unit-card");
                        if (card) {
                            const partDimInput = card.querySelector('input[data-field="partitionHeight"]');
                            if (partDimInput) partDimInput.value = newPartH.toFixed(1);

                            const partPsbInput = card.querySelector(".part-h-input");
                            if (partPsbInput) partPsbInput.value = newPartH.toFixed(1);

                            const psbHint = card.querySelector(".psb-hint");
                            if (psbHint) psbHint.textContent = `${val} - (${d} × 2)`;

                            const psbCuts = card.querySelector(".psb-cuts-preview");
                            const P = Math.max(0, parseInt(targetUnit.partitions) || 0);
                            const partD = Math.max(0, parseFloat(targetUnit.depth || 0) - (d * 2)).toFixed(1);
                            if (psbCuts) {
                                psbCuts.innerHTML = P > 0 
                                    ? `<span><strong>${P * 2}</strong> قائم (${newPartH.toFixed(1)} سم) + <strong>${P * 2}</strong> عمق (${partD} سم)</span>`
                                    : `<span style="color: var(--text-muted);">لا توجد فواصل مضافة</span>`;
                            }

                            // تحديث شارات مقاسات الضلف المرتبطة بارتفاع الفاصل
                            card.querySelectorAll(".door-item-row").forEach(doorRow => {
                                const doorId = doorRow.dataset.doorId;
                                const door = (targetUnit.doorsList || []).find(dr => dr.id === doorId);
                                if (door) {
                                    updateDoorBadge(doorRow, door, targetUnit);
                                }
                            });
                        }
                        markCalculationPending("تم تعديل الارتفاع الكلي وارتفاع الفاصل - اضغط احسب لتحديث النتائج");
                    }
                }
            });

            // تأكيد التغيير وتحديث العلبة بالكامل
            input.addEventListener("change", (e) => {
                const id = e.target.dataset.id;
                const field = e.target.dataset.field;
                const val = field === "name" ? e.target.value : (parseFloat(e.target.value) || 0);

                const targetUnit = state.units.find(u => u.id === id);
                if (targetUnit) {
                    targetUnit[field] = val;
                    // تحديث ارتفاع الفاصل تلقائياً في بيانات العلبة عند تعديل الارتفاع الكلي
                    if (field === "height") {
                        const d = parseFloat(state.profileDeduction || 0);
                        targetUnit.partitionHeight = Math.max(0, val - (d * 2));
                    }
                    autoCalculateUnitDivisions(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending("تم تعديل المقاسات - اضغط احسب لتحديث النتائج");
                }
            });
        });

        // زر إضافة رف (يدوي)
        unitsContainer.querySelectorAll(".add-shelf-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const unitId = btn.dataset.unitId;
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit) {
                    if (!targetUnit.shelvesList) targetUnit.shelvesList = [];
                    const nextNum = targetUnit.shelvesList.length + 1;
                    const d = parseFloat(state.profileDeduction || 0);
                    const P = Math.max(0, parseInt(targetUnit.partitions) || 0);
                    const N = P + 1;
                    const netW = Math.max(0, targetUnit.width - (2 * d) - (P * d));
                    const defW = targetUnit.shelvesList.length > 0 
                        ? targetUnit.shelvesList[targetUnit.shelvesList.length - 1].width 
                        : (netW > 0 ? Math.round((netW / N) * 100) / 100 : targetUnit.width);

                    const newShelfId = "s_" + Date.now();
                    targetUnit.shelvesList.push({
                        id: newShelfId,
                        sectionId: "sec_custom_" + newShelfId,
                        width: defW,
                        depth: targetUnit.depth,
                        label: `رف #${nextNum}`
                    });
                    syncUnitDoorsFromShelves(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending("تم إضافة رف - اضغط احسب لتحديث النتائج");
                    showToast(`✓ تم إضافة رف #${nextNum}`);
                }
            });
        });

        // حذف رف
        unitsContainer.querySelectorAll(".shelf-del-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const unitId = btn.dataset.unitId;
                const shelfId = btn.dataset.shelfId;
                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit && targetUnit.shelvesList) {
                    targetUnit.shelvesList = targetUnit.shelvesList.filter(s => s.id !== shelfId);
                    syncUnitDoorsFromShelves(targetUnit);
                    saveState();
                    renderUnits();
                    markCalculationPending("تم حذف رف - اضغط احسب لتحديث النتائج");
                    showToast("تم حذف الرف");
                }
            });
        });

        // تعديل عرض الرف يدوياً
        unitsContainer.querySelectorAll(".shelf-w-input").forEach(input => {
            input.addEventListener("input", (e) => {
                const unitId = e.target.dataset.unitId;
                const shelfId = e.target.dataset.shelfId;
                const val = parseFloat(e.target.value) || 0;

                const targetUnit = state.units.find(u => u.id === unitId);
                if (targetUnit && targetUnit.shelvesList) {
                    const shelf = targetUnit.shelvesList.find(s => s.id === shelfId);
                    if (shelf) {
                        shelf.width = val;
                        if (shelf.sectionId) {
                            targetUnit.shelvesList.forEach(s => {
                                if (s.sectionId === shelf.sectionId) s.width = val;
                            });
                        }
                        syncUnitDoorsFromShelves(targetUnit);

                        const card = e.target.closest(".unit-card");
                        if (card) {
                            const doorsContainer = card.querySelector(".doors-list-container");
                            const doorsTitle = card.querySelector(".doors-title");
                            const actualPartH = (parseFloat(targetUnit.partitionHeight) || (targetUnit.height - (parseFloat(state.profileDeduction || 0) * 2)));
                            if (doorsContainer) {
                                doorsContainer.innerHTML = buildDoorsHtml(targetUnit, actualPartH);
                                attachDoorEvents(doorsContainer, targetUnit);
                            }
                            if (doorsTitle) {
                                doorsTitle.textContent = `🚪 الضلف (${(targetUnit.doorsList || []).length})`;
                            }
                        }

                        saveState();
                        markCalculationPending();
                    }
                }
            });
        });

        // تكرار العلبة
        unitsContainer.querySelectorAll(".duplicate-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                const source = state.units.find(u => u.id === id);
                if (source) {
                    const clone = JSON.parse(JSON.stringify(source));
                    clone.id = "u_" + Date.now();
                    clone.name = source.name + " (مكرر)";
                    state.units.push(clone);
                    saveState();
                    renderUnits();
                    markCalculationPending("تم نسخ علبة - اضغط احسب لتحديث النتائج");
                    showToast("✓ تم نسخ العلبة بكامل أبعادها");
                }
            });
        });

        // حذف العلبة
        unitsContainer.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                state.units = state.units.filter(u => u.id !== id);
                saveState();
                renderUnits();
                markCalculationPending("تم حذف علبة - اضغط احسب لتحديث النتائج");
                showToast("تم حذف العلبة");
            });
        });
    }

    function updateDoorBadge(doorRow, door, unit) {
        if (!doorRow) return;
        const badge = doorRow.querySelector(".door-calc-badge");
        if (!badge) return;

        const d = parseFloat(state.profileDeduction || 0);
        const actualPartH = (parseFloat(unit.partitionHeight) || (unit.height - (d * 2)));
        const doorW = parseFloat(door.finalWidth || (door.shelfWidth + 2.3)).toFixed(1);
        const extraH = door.handleType === "external" ? 3.0 : 0.0;
        const doorH = (actualPartH + extraH).toFixed(1);

        badge.textContent = `مقاس الدرفة: ${doorW} × ${doorH} سم`;
    }

    // --- Recalculate Everything ---
    function recalculateAll() {
        let allChassisPieces = [];
        let allDoorPieces = [];
        let allDrawerPieces = [];

        state.units.forEach(unit => {
            const result = AluminumCalculator.calculateUnitPieces(unit, {
                profileDeduction: state.profileDeduction
            });
            allChassisPieces = allChassisPieces.concat(result.chassisPieces);
            allDoorPieces = allDoorPieces.concat(result.doorPieces);
            allDrawerPieces = allDrawerPieces.concat(result.drawerPieces);
        });

        const chassisOpt = CuttingOptimizer.optimize(
            allChassisPieces,
            state.chassisStockLength,
            state.bladeKerf
        );

        const doorOpt = CuttingOptimizer.optimize(
            allDoorPieces,
            state.doorStockLength,
            state.bladeKerf
        );

        const drawerOpt = CuttingOptimizer.optimize(
            allDrawerPieces,
            drawerStockLength,
            state.bladeKerf
        );

        const allPiecesCombined = allChassisPieces.concat(allDoorPieces, allDrawerPieces);
        const groupedCuts = AluminumCalculator.groupSimilarPieces(allPiecesCombined);

        const totalNetMeters = (parseFloat(chassisOpt.totalUsedMeters) + parseFloat(doorOpt.totalUsedMeters) + parseFloat(drawerOpt.totalUsedMeters)).toFixed(2);
        const totalStockLength = (chassisOpt.totalBars * state.chassisStockLength) + (doorOpt.totalBars * state.doorStockLength) + (drawerOpt.totalBars * drawerStockLength);
        const totalNetLength = (parseFloat(totalNetMeters) * 100);
        const totalEfficiency = totalStockLength > 0 ? ((totalNetLength / totalStockLength) * 100).toFixed(1) : 0;

        chassisBarsDisplay.textContent = chassisOpt.totalBars;
        chassisBarsTabBadge.textContent = `${chassisOpt.totalBars} عود`;
        doorBarsDisplay.textContent = doorOpt.totalBars;
        doorBarsTabBadge.textContent = `${doorOpt.totalBars} عود`;
        drawerBarsDisplay.textContent = drawerOpt.totalBars;
        drawerBarsTabBadge.textContent = `${drawerOpt.totalBars} عود`;
        drawerStockSub.textContent = `عود بطول ${(drawerStockLength / 100).toFixed(1)} متر`;

        totalUsedMetersDisplay.textContent = totalNetMeters;
        chassisMetersSub.textContent = chassisOpt.totalUsedMeters;
        doorMetersSub.textContent = doorOpt.totalUsedMeters;
        drawerMetersSub.textContent = drawerOpt.totalUsedMeters;

        efficiencyDisplay.textContent = `${totalEfficiency}%`;
        chassisWasteSub.textContent = chassisOpt.totalWasteMeters;
        doorWasteSub.textContent = doorOpt.totalWasteMeters;
        drawerWasteSub.textContent = drawerOpt.totalWasteMeters;

        renderBarsPlan(chassisBarsListContainer, chassisOpt.bars, state.chassisStockLength, "شاسيه");
        renderBarsPlan(doorsBarsListContainer, doorOpt.bars, state.doorStockLength, "ضلف");
        renderBarsPlan(drawerBarsListContainer, drawerOpt.bars, drawerStockLength, "2×8 للأدراج");
        renderCuttingTable(groupedCuts);
        preparePrintSheet(chassisOpt, doorOpt, drawerOpt, groupedCuts);
    }

    // --- Render Visual Bars Plan ---
    function renderBarsPlan(container, bars, stockLength, planType) {
        if (!bars || bars.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 25px; color: var(--text-muted);">
                    لا توجد قطع ${planType} للتقطيع حالياً.
                </div>
            `;
            return;
        }

        container.innerHTML = "";
        bars.forEach(bar => {
            const barCard = document.createElement("div");
            barCard.className = "bar-plan-card";

            let segmentsHtml = "";
            let tagsHtml = "";

            bar.cuts.forEach(cut => {
                const pct = ((cut.length / stockLength) * 100).toFixed(2);
                let segClass = "seg-height";

                if (cut.category === "أدراج 2×8") {
                    segClass = "seg-drawer";
                } else if (cut.category === "ضلف") {
                    segClass = cut.type.includes("قائم") ? "seg-door-vert" : "seg-door-horiz";
                } else {
                    if (cut.group === "عوارض" && !cut.type.includes("رف")) segClass = "seg-width";
                    else if (cut.group === "أعماق" && !cut.type.includes("رف")) segClass = "seg-depth";
                    else if (cut.type.includes("رف")) segClass = "seg-shelves";
                }

                segmentsHtml += `
                    <div class="bar-segment ${segClass}" style="width: ${pct}%;" title="${escapeHtml(cut.desc)} - ${escapeHtml(cut.unitName)}">
                        ${cut.length.toFixed(1)} سم
                    </div>
                `;

                tagsHtml += `
                    <span class="cut-tag">
                        <strong>${cut.length.toFixed(1)} سم</strong> (${cut.type} - ${cut.unitName})
                    </span>
                `;
            });

            if (bar.scrap > 0) {
                const wastePct = ((bar.scrap / stockLength) * 100).toFixed(2);
                segmentsHtml += `
                    <div class="bar-segment seg-waste" style="width: ${wastePct}%;" title="السقاطة المتبقية: ${bar.scrap.toFixed(1)} سم">
                        ${bar.scrap > 10 ? `باقي ${bar.scrap.toFixed(1)} سم` : ''}
                    </div>
                `;
            }

            barCard.innerHTML = `
                <div class="bar-plan-header">
                    <span class="bar-title">عود ${planType} رقم #${bar.barNumber} (طول ${stockLength} سم)</span>
                    <span class="bar-metrics">
                        الصافي المستخدم: <strong>${bar.netUsedLength.toFixed(1)} سم</strong> |
                        السقاطة: <strong>${bar.scrap.toFixed(1)} سم</strong> |
                        الاستغلال: <strong>${bar.efficiency}%</strong>
                    </span>
                </div>
                <div class="visual-bar-track">
                    ${segmentsHtml}
                </div>
                <div class="bar-cuts-details">
                    ${tagsHtml}
                </div>
            `;
            container.appendChild(barCard);
        });
    }

    // --- Render Grouped Cutting Table ---
    function renderCuttingTable(groupedList) {
        if (!groupedList || groupedList.length === 0) {
            cuttingTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">
                        لا توجد مقاسات مسجلة
                    </td>
                </tr>
            `;
            return;
        }

        cuttingTableBody.innerHTML = "";
        groupedList.forEach((item, index) => {
            const tr = document.createElement("tr");
            const isChassis = (item.category === "شاسيه");
            const catBadge = isChassis
                ? '<span class="cat-badge cat-chassis">🪵 عود شاسيه</span>'
                : item.category === "أدراج 2×8"
                    ? '<span class="cat-badge cat-drawer">🗄️ عود 2×8 درج</span>'
                    : '<span class="cat-badge cat-door">🚪 عود ضلفة</span>';

            tr.innerHTML = `
                <td style="color: var(--text-muted); text-align: center;">${index + 1}</td>
                <td style="font-size: 1.15rem; color: var(--accent-cyan); font-weight: 800;">${item.length.toFixed(1)}</td>
                <td>${catBadge}</td>
                <td><strong>${escapeHtml(item.type)}</strong></td>
                <td style="font-size: 1.15rem; color: #fff;">${item.count} قطعة</td>
                <td>${(item.totalLength / 100).toFixed(2)} م</td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(item.unitsStr)}</td>
            `;
            cuttingTableBody.appendChild(tr);
        });
    }

    // --- Prepare Print Sheet ---
    function preparePrintSheet(chassisOpt, doorOpt, drawerOpt, groupedCuts) {
        document.getElementById("printDate").textContent = new Date().toLocaleDateString("ar-EG");
        document.getElementById("printClientName").textContent = state.clientName || "بدون اسم";
        document.getElementById("printChassisBars").textContent = chassisOpt.totalBars;
        document.getElementById("printChassisLen").textContent = state.chassisStockLength;
        document.getElementById("printDoorBars").textContent = doorOpt.totalBars;
        document.getElementById("printDoorLen").textContent = state.doorStockLength;
        document.getElementById("printDrawerBars").textContent = drawerOpt.totalBars;

        // 1. جدول العلب
        const unitsTbody = document.querySelector("#printUnitsTable tbody");
        unitsTbody.innerHTML = "";
        state.units.forEach(u => {
            const row = document.createElement("tr");
            const shelvesStr = (u.shelvesList || []).map((s, i) => `${s.label || ('رف ' + (i+1))}: (${s.width}×${s.depth}سم)`).join("<br>") || "بدون";
            
            const d = parseFloat(state.profileDeduction || 0);
            const actualPartH = (parseFloat(u.partitionHeight) || (u.height - (d * 2))).toFixed(1);
            const doorsStr = (u.doorsList || []).map((door, i) => {
                const w = parseFloat(door.finalWidth || (door.shelfWidth + 2.3)).toFixed(1);
                const h = (parseFloat(actualPartH) + (door.handleType === "external" ? 3 : 0)).toFixed(1);
                const hType = door.handleType === "external" ? "مقبض خارجي" : "بلت إن";
                const isSplitTag = door.isSplit ? " (مزدوجة)" : "";
                return `ضلفة ${i+1}${isSplitTag}: (${w}×${h}سم - ${hType})`;
            }).join("<br>") || "بدون";
            const drawerWidth = parseFloat(u.drawerOpeningWidth);
            const drawersStr = u.unitType !== "upper" && u.hasDrawers
                ? Number.isFinite(drawerWidth)
                    ? `${u.drawerCount || 1} درج: (${(Math.max(0, drawerWidth - 2.6)).toFixed(1)} × ${(Math.max(0, parseFloat(u.depth || 0) - 3)).toFixed(1)} سم لكل درج)`
                    : `${u.drawerCount || 1} درج: عرض الفتحة غير محدد`
                : "بدون";

            const typeLabel = u.unitType === "upper" ? (u.hasDishRack ? `علوية (مطبقية ${u.dishRackSize}سم)` : "علوية") : "سفلية";

            row.innerHTML = `
                <td><strong>${escapeHtml(u.name)}</strong><br><small style="color:#64748b;">${typeLabel}</small></td>
                <td>${u.width} × ${u.height} × ${u.depth} سم</td>
                <td>${actualPartH} سم</td>
                <td>${u.partitions || 0}</td>
                <td>${shelvesStr}</td>
                <td>${doorsStr}</td>
                <td>${drawersStr}</td>
                <td>${u.quantity || 1}</td>
            `;
            unitsTbody.appendChild(row);
        });

        // 2. جدول مقاسات التقطيع المجمع
        const cutsTbody = document.querySelector("#printCutsTable tbody");
        cutsTbody.innerHTML = "";
        groupedCuts.forEach((c, idx) => {
            const row = document.createElement("tr");
            const catLabel = c.category === "شاسيه"
                ? "عود شاسيه"
                : c.category === "أدراج 2×8" ? "عود 2×8 درج" : "عود ضلفة";
            row.innerHTML = `
                <td>${idx + 1}</td>
                <td><strong>${c.length.toFixed(1)} سم</strong></td>
                <td>${catLabel}</td>
                <td>${escapeHtml(c.type)}</td>
                <td><strong>${c.count} قطعة</strong></td>
                <td>${escapeHtml(c.unitsStr)}</td>
            `;
            cutsTbody.appendChild(row);
        });

        // 3. خطة أعواد الشاسيه للطباعة
        const printChassisBarsContainer = document.getElementById("printChassisBarsPlan");
        printChassisBarsContainer.innerHTML = "";
        chassisOpt.bars.forEach(b => {
            const box = document.createElement("div");
            box.className = "print-bar-box";
            const cutsStr = b.cuts.map(c => `${c.length.toFixed(1)} سم (${c.type})`).join(" + ");
            box.innerHTML = `
                <div class="print-bar-title">عود شاسيه #${b.barNumber} (طول ${b.stockLength} سم) - استغلال: ${b.efficiency}%:</div>
                <div style="font-size: 0.85rem;">✂️ القطع: <strong>${cutsStr}</strong> | السقاطة (الباقي): <strong>${b.scrap.toFixed(1)} سم</strong></div>
            `;
            printChassisBarsContainer.appendChild(box);
        });

        // 4. خطة أعواد الضلف للطباعة
        const printDoorBarsContainer = document.getElementById("printDoorBarsPlan");
        printDoorBarsContainer.innerHTML = "";
        doorOpt.bars.forEach(b => {
            const box = document.createElement("div");
            box.className = "print-bar-box";
            const cutsStr = b.cuts.map(c => `${c.length.toFixed(1)} سم (${c.type})`).join(" + ");
            box.innerHTML = `
                <div class="print-bar-title">عود ضلفة #${b.barNumber} (طول ${b.stockLength} سم) - استغلال: ${b.efficiency}%:</div>
                <div style="font-size: 0.85rem;">✂️ القطع: <strong>${cutsStr}</strong> | السقاطة (الباقي): <strong>${b.scrap.toFixed(1)} سم</strong></div>
            `;
            printDoorBarsContainer.appendChild(box);
        });

        const printDrawerBarsContainer = document.getElementById("printDrawerBarsPlan");
        printDrawerBarsContainer.innerHTML = "";
        drawerOpt.bars.forEach(b => {
            const box = document.createElement("div");
            box.className = "print-bar-box";
            const cutsStr = b.cuts.map(c => `${c.length.toFixed(1)} سم (${c.type})`).join(" + ");
            box.innerHTML = `
                <div class="print-bar-title">عود 2×8 درج #${b.barNumber} (طول ${b.stockLength} سم) - استغلال: ${b.efficiency}%:</div>
                <div style="font-size: 0.85rem;">✂️ القطع: <strong>${cutsStr}</strong> | السقاطة (الباقي): <strong>${b.scrap.toFixed(1)} سم</strong></div>
            `;
            printDrawerBarsContainer.appendChild(box);
        });
    }

    // --- Tabs Handling ---
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            const target = btn.dataset.tab;
            document.getElementById(target).classList.add("active");
        });
    });

    // --- Print & Save Action Buttons ---
    printJobBtn.addEventListener("click", () => {
        if (calculationPending) {
            recalculateAll();
            markCalculationFresh();
        }
        window.print();
    });

    saveProjectBtn.addEventListener("click", () => {
        saveState();
        showToast("✓ تم حفظ بيانات المطبخ بنجاح!");
    });

    function escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize App
    loadSavedState();
    renderUnits();
    recalculateAll();
    markCalculationFresh();
});
