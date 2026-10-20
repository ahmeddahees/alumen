/**
 * Aluminum Kitchen Cabinet Calculator
 * حساب تفصيلي لقطع الألومنيوم لشاسيه المطابخ، الأرفف المخصصة، وقطاع الضلف
 */

const AluminumCalculator = {
    /**
     * يحسب قطع الألومنيوم مقسمة إلى: قطع شاسيه المطبخ، وقطع قطاع الضلف
     * @param {Object} unit - بيانات العلبة
     * @param {Object} settings - إعدادات التخصيص وخصم القطاع
     * @returns {Object} { chassisPieces, doorPieces }
     */
    calculateUnitPieces(unit, settings = {}) {
        const {
            name = "علبة مطبخ",
            width = 0,               // العرض الكلي للعلبة (سم)
            height = 0,              // الارتفاع الكلي للعلبة (سم)
            depth = 0,               // العمق الكلي للعلبة (سم)
            partitionHeight = null,  // ارتفاع الفاصل (سم)
            partitions = 0,          // عدد الفواصل الرأسية
            shelvesList = [],        // قائمة الأرفف المخصصة [{ id, width, depth }]
            doorsList = [],          // قائمة الضلف [{ id, shelfWidth, handleType, isSplit, finalWidth }]
            quantity = 1             // كمية الوحدات المتطابقة
        } = unit;

        const profileDeduction = parseFloat(settings.profileDeduction || 0);
        
        // القاعدة 1 (المعدلة): ارتفاع الفاصل = الارتفاع الكلي - (خصم التجميع × 2)
        const defaultPartitionH = Math.max(0, height - (profileDeduction * 2));
        const actualPartitionH = parseFloat(partitionHeight !== null && partitionHeight !== undefined && partitionHeight !== "" ? partitionHeight : defaultPartitionH);

        const chassisPieces = [];
        const doorPieces = [];

        for (let q = 1; q <= quantity; q++) {
            const unitLabel = quantity > 1 ? `${name} (#${q})` : name;

            // ==========================================
            // 1. قطع شاسيه العلبة الأساسي (عود المطبخ)
            // ==========================================

            // 1.1 القوائم الرأسية الأساسية (4 قوائم للهيكل الخارجي)
            // يخصم خصم التجميع من الارتفاع الكلي مثل العرض تماماً
            const hCut = Math.max(0, height - (profileDeduction * 2));
            for (let i = 0; i < 4; i++) {
                chassisPieces.push({
                    unitName: unitLabel,
                    category: "شاسيه",
                    type: "قائم خارجي",
                    group: "قوائم",
                    length: hCut,
                    desc: `قائم هيكل رئيسي (${hCut.toFixed(1)} سم)`
                });
            }

            // 1.2 العوارض العرضية الأساسية (4 عوارض: 2 فوق و2 تحت)
            const wCut = Math.max(0, width - (profileDeduction * 2));
            for (let i = 0; i < 4; i++) {
                chassisPieces.push({
                    unitName: unitLabel,
                    category: "شاسيه",
                    type: "عارضة عرض",
                    group: "عوارض",
                    length: wCut,
                    desc: `عارضة هيكل رئيسي (${wCut} سم)`
                });
            }

            // 1.3 جسور الأعماق الأساسية (4 أعماق: 2 يمين و2 شمال)
            const dCut = Math.max(0, depth - (profileDeduction * 2));
            for (let i = 0; i < 4; i++) {
                chassisPieces.push({
                    unitName: unitLabel,
                    category: "شاسيه",
                    type: "عمق هيكل",
                    group: "أعماق",
                    length: dCut,
                    desc: `عمق هيكل رئيسي (${dCut} سم)`
                });
            }

            // 1.4 الفواصل الرأسية (Partitions)
            // كل فاصل رأسي يحتاج: 2 قائم بارتفاع الفاصل + 2 عمق لتثبيته
            if (partitions > 0) {
                const partH = Math.max(0, actualPartitionH);
                const partD = Math.max(0, depth - (profileDeduction * 2));

                for (let p = 1; p <= partitions; p++) {
                    // قائمان للفاصل
                    chassisPieces.push({
                        unitName: unitLabel,
                        category: "شاسيه",
                        type: "قائم فاصل رأسي",
                        group: "قوائم",
                        length: partH,
                        desc: `قائم فاصل #${p} (${partH.toFixed(1)} سم)`
                    });
                    chassisPieces.push({
                        unitName: unitLabel,
                        category: "شاسيه",
                        type: "قائم فاصل رأسي",
                        group: "قوائم",
                        length: partH,
                        desc: `قائم فاصل #${p} (${partH.toFixed(1)} سم)`
                    });

                    // عمقان لتثبيت الفاصل
                    chassisPieces.push({
                        unitName: unitLabel,
                        category: "شاسيه",
                        type: "عمق تثبيت فاصل",
                        group: "أعماق",
                        length: partD,
                        desc: `عمق فاصل #${p} (${partD.toFixed(1)} سم)`
                    });
                    chassisPieces.push({
                        unitName: unitLabel,
                        category: "شاسيه",
                        type: "عمق تثبيت فاصل",
                        group: "أعماق",
                        length: partD,
                        desc: `عمق فاصل #${p} (${partD.toFixed(1)} سم)`
                    });
                }
            }

            // 1.5 الأرفف المخصصة (Custom Shelves)
            // العمق ثابت = عمق الوحدة
            if (shelvesList && shelvesList.length > 0) {
                shelvesList.forEach((shelf, sIdx) => {
                    const sWidth = Math.max(0, parseFloat(shelf.width || width));
                    const sDepth = Math.max(0, parseFloat(shelf.depth || depth) - (profileDeduction * 2));
                    const sNum = sIdx + 1;

                    // عارضتان للرف
                    chassisPieces.push({
                        unitName: unitLabel,
                        category: "شاسيه",
                        type: `عارضة رف #${sNum}`,
                        group: "عوارض",
                        length: sWidth,
                        desc: `عارضة رف #${sNum} (عرض ${sWidth.toFixed(1)} سم)`
                    });
                    chassisPieces.push({
                        unitName: unitLabel,
                        category: "شاسيه",
                        type: `عارضة رف #${sNum}`,
                        group: "عوارض",
                        length: sWidth,
                        desc: `عارضة رف #${sNum} (عرض ${sWidth.toFixed(1)} سم)`
                    });

                    // عمقان للرف
                    chassisPieces.push({
                        unitName: unitLabel,
                        category: "شاسيه",
                        type: `عمق رف #${sNum}`,
                        group: "أعماق",
                        length: sDepth,
                        desc: `عمق رف #${sNum} (عمق ${sDepth.toFixed(1)} سم)`
                    });
                    chassisPieces.push({
                        unitName: unitLabel,
                        category: "شاسيه",
                        type: `عمق رف #${sNum}`,
                        group: "أعماق",
                        length: sDepth,
                        desc: `عمق رف #${sNum} (عمق ${sDepth.toFixed(1)} سم)`
                    });
                });
            }

            // ==========================================
            // 2. قطع قطاع الضلف (عود الضلفة المخصص)
            // ==========================================
            if (doorsList && doorsList.length > 0) {
                doorsList.forEach((door, dIdx) => {
                    const dNum = dIdx + 1;
                    const baseShelfW = parseFloat(door.shelfWidth || width);
                    const handleType = door.handleType || "external";

                    // حساب العرض
                    let finalDoorWidth;
                    if (door.finalWidth !== undefined && door.finalWidth !== null && door.finalWidth > 0) {
                        finalDoorWidth = parseFloat(door.finalWidth);
                    } else {
                        const rawWidth = baseShelfW + 2.3;
                        finalDoorWidth = (door.isSplit || rawWidth > 45.0) ? (rawWidth / 2.0) : rawWidth;
                    }

                    // حساب الارتفاع:
                    // مقبض خارجي: ارتفاع الفاصل + 3 سم
                    // بلت إن: نفس ارتفاع الفاصل
                    const extraHeight = handleType === "external" ? 3.0 : 0.0;
                    const finalDoorHeight = Math.max(0, actualPartitionH + extraHeight);

                    const handleLabel = handleType === "external" ? "مقبض خارجي (+3سم)" : "بلت إن (ارتفاع الفاصل)";
                    const splitLabel = door.isSplit ? " [درفة مزدوجة/مقسومة]" : "";

                    // قائمان للدرفة (بارتفاع الدرفة)
                    doorPieces.push({
                        unitName: unitLabel,
                        category: "ضلف",
                        type: "قائم ضلفة",
                        group: "ضلف",
                        length: finalDoorHeight,
                        doorInfo: `ضلفة #${dNum}${splitLabel} (${handleLabel})`,
                        desc: `قائم ضلفة #${dNum} (${finalDoorHeight.toFixed(1)} سم)`
                    });
                    doorPieces.push({
                        unitName: unitLabel,
                        category: "ضلف",
                        type: "قائم ضلفة",
                        group: "ضلف",
                        length: finalDoorHeight,
                        doorInfo: `ضلفة #${dNum}${splitLabel} (${handleLabel})`,
                        desc: `قائم ضلفة #${dNum} (${finalDoorHeight.toFixed(1)} سم)`
                    });

                    // عارضتان للدرفة (بعرض الدرفة)
                    doorPieces.push({
                        unitName: unitLabel,
                        category: "ضلف",
                        type: "عارضة ضلفة",
                        group: "ضلف",
                        length: finalDoorWidth,
                        doorInfo: `ضلفة #${dNum}${splitLabel}`,
                        desc: `عارضة ضلفة #${dNum} (${finalDoorWidth.toFixed(1)} سم)`
                    });
                    doorPieces.push({
                        unitName: unitLabel,
                        category: "ضلف",
                        type: "عارضة ضلفة",
                        group: "ضلف",
                        length: finalDoorWidth,
                        doorInfo: `ضلفة #${dNum}${splitLabel}`,
                        desc: `عارضة ضلفة #${dNum} (${finalDoorWidth.toFixed(1)} سم)`
                    });
                });
            }
        }

        return {
            chassisPieces,
            doorPieces
        };
    },

    /**
     * تجميع القطع المتشابهة في جدول مقاسات ملخص
     */
    groupSimilarPieces(pieces) {
        const map = new Map();
        pieces.forEach(p => {
            const key = `${p.length.toFixed(1)}_${p.type}_${p.category || 'شاسيه'}`;
            if (!map.has(key)) {
                map.set(key, {
                    length: p.length,
                    type: p.type,
                    group: p.group,
                    category: p.category || 'شاسيه',
                    count: 0,
                    units: new Set()
                });
            }
            const item = map.get(key);
            item.count += 1;
            item.units.add(p.unitName);
        });

        const list = Array.from(map.values()).map(item => ({
            ...item,
            unitsStr: Array.from(item.units).join("، "),
            totalLength: item.count * item.length
        }));

        return list.sort((a, b) => b.length - a.length);
    }
};

window.AluminumCalculator = AluminumCalculator;
